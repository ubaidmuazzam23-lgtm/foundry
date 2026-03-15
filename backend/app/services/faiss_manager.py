# File: backend/app/services/faiss_manager.py
# FAISS Vector Store for Document Retrieval
# Handles embeddings, indexing, and semantic search

import os
import pickle
import numpy as np
from typing import List, Dict, Optional, Any
from sentence_transformers import SentenceTransformer
from app.utils.logger import logger

try:
    import faiss
except ImportError:
    logger.warning("FAISS not installed. Install: pip install faiss-cpu")


class FAISSManager:
    """
    Manages FAISS vector store for document retrieval.
    
    Features:
    - Document embedding using sentence transformers
    - FAISS indexing for fast similarity search
    - Semantic retrieval of relevant chunks
    - Persistence for caching
    """
    
    def __init__(
        self, 
        index_path: str = "/tmp/faiss_index",
        model_name: str = "all-MiniLM-L6-v2"
    ):
        self.index_path = index_path
        self.model_name = model_name
        
        # Load embedding model
        logger.info(f"🔢 Loading embedding model: {model_name}")
        self.embedding_model = SentenceTransformer(model_name)
        self.embedding_dim = self.embedding_model.get_sentence_embedding_dimension()
        
        # Initialize FAISS index
        self.index = None
        self.documents = []  # Store actual documents
        self.metadata = []   # Store metadata
        
        # Load existing index if available
        self._load_index()
        
        logger.info(f"💾 FAISS Manager initialized (dim={self.embedding_dim})")
    
    def add_documents(
        self, 
        chunks: List[Dict[str, Any]],
        source_info: Dict[str, str]
    ) -> int:
        """
        Add document chunks to FAISS index.
        
        Args:
            chunks: List of text chunks with metadata
            source_info: Info about source document
        
        Returns:
            Number of chunks added
        """
        
        if not chunks:
            return 0
        
        texts = [chunk['text'] for chunk in chunks]
        
        # Generate embeddings
        logger.info(f"   🔢 Generating embeddings for {len(texts)} chunks...")
        embeddings = self.embedding_model.encode(texts, show_progress_bar=False)
        embeddings = np.array(embeddings).astype('float32')
        
        # Initialize index if not exists
        if self.index is None:
            self.index = faiss.IndexFlatL2(self.embedding_dim)
            logger.info(f"   ✅ Created new FAISS index (dim={self.embedding_dim})")
        
        # Add to index
        self.index.add(embeddings)
        
        # Store documents and metadata
        for i, chunk in enumerate(chunks):
            self.documents.append(chunk['text'])
            self.metadata.append({
                'chunk_index': len(self.documents) - 1,
                'source_title': source_info.get('title', 'Unknown'),
                'source_url': source_info.get('url', ''),
                'source_file': source_info.get('path', ''),
                'chunk_type': chunk.get('type', 'text'),
                'page': chunk.get('page'),
                'metadata': chunk.get('metadata', {})
            })
        
        logger.info(f"   ✅ Added {len(chunks)} chunks to FAISS (total: {self.index.ntotal})")
        
        # Save index
        self._save_index()
        
        return len(chunks)
    
    def search(
        self, 
        query: str, 
        top_k: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search for relevant documents using semantic similarity.
        
        Args:
            query: Search query
            top_k: Number of results to return
        
        Returns:
            List of relevant document chunks with metadata
        """
        
        if self.index is None or self.index.ntotal == 0:
            logger.warning("FAISS index is empty")
            return []
        
        # Embed query
        query_embedding = self.embedding_model.encode([query])
        query_embedding = np.array(query_embedding).astype('float32')
        
        # Search
        distances, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))
        
        # Prepare results
        results = []
        for i, (distance, idx) in enumerate(zip(distances[0], indices[0])):
            if idx < len(self.documents):
                results.append({
                    'rank': i + 1,
                    'text': self.documents[idx],
                    'distance': float(distance),
                    'similarity': float(1 / (1 + distance)),  # Convert distance to similarity
                    'source_title': self.metadata[idx]['source_title'],
                    'source_url': self.metadata[idx]['source_url'],
                    'chunk_type': self.metadata[idx]['chunk_type'],
                    'page': self.metadata[idx]['page'],
                    'metadata': self.metadata[idx]['metadata']
                })
        
        return results
    
    def batch_search(
        self, 
        queries: List[str], 
        top_k: int = 5
    ) -> Dict[str, List[Dict]]:
        """
        Search for multiple queries at once.
        
        Args:
            queries: List of search queries
            top_k: Number of results per query
        
        Returns:
            Dict mapping queries to results
        """
        
        results = {}
        
        for query in queries:
            results[query] = self.search(query, top_k)
        
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        """Get statistics about the FAISS index."""
        
        return {
            'total_chunks': self.index.ntotal if self.index else 0,
            'total_documents': len(set(m['source_title'] for m in self.metadata)),
            'embedding_dimension': self.embedding_dim,
            'index_size_mb': self._get_index_size_mb()
        }
    
    def clear_index(self):
        """Clear the entire index."""
        
        self.index = None
        self.documents = []
        self.metadata = []
        
        # Remove saved files
        try:
            if os.path.exists(f"{self.index_path}.index"):
                os.remove(f"{self.index_path}.index")
            if os.path.exists(f"{self.index_path}.docs"):
                os.remove(f"{self.index_path}.docs")
            if os.path.exists(f"{self.index_path}.meta"):
                os.remove(f"{self.index_path}.meta")
        except:
            pass
        
        logger.info("🗑️ FAISS index cleared")
    
    def _save_index(self):
        """Save FAISS index to disk."""
        
        if self.index is None:
            return
        
        try:
            os.makedirs(os.path.dirname(self.index_path), exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.index, f"{self.index_path}.index")
            
            # Save documents
            with open(f"{self.index_path}.docs", 'wb') as f:
                pickle.dump(self.documents, f)
            
            # Save metadata
            with open(f"{self.index_path}.meta", 'wb') as f:
                pickle.dump(self.metadata, f)
            
            logger.debug(f"💾 Index saved to {self.index_path}")
        
        except Exception as e:
            logger.error(f"Failed to save index: {e}")
    
    def _load_index(self):
        """Load FAISS index from disk."""
        
        try:
            if os.path.exists(f"{self.index_path}.index"):
                # Load FAISS index
                self.index = faiss.read_index(f"{self.index_path}.index")
                
                # Load documents
                with open(f"{self.index_path}.docs", 'rb') as f:
                    self.documents = pickle.load(f)
                
                # Load metadata
                with open(f"{self.index_path}.meta", 'rb') as f:
                    self.metadata = pickle.load(f)
                
                logger.info(f"📂 Loaded existing index with {self.index.ntotal} chunks")
        
        except Exception as e:
            logger.debug(f"No existing index found or load failed: {e}")
    
    def _get_index_size_mb(self) -> float:
        """Calculate index size in MB."""
        
        try:
            total_size = 0
            for suffix in ['.index', '.docs', '.meta']:
                path = f"{self.index_path}{suffix}"
                if os.path.exists(path):
                    total_size += os.path.getsize(path)
            return round(total_size / (1024 * 1024), 2)
        except:
            return 0.0