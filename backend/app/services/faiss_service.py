# File: backend/app/services/faiss_service.py
# FAISS Vector Database for RAG

import os
import pickle
from typing import List, Dict, Any
import numpy as np
from pathlib import Path
from app.utils.logger import logger

try:
    import faiss
    FAISS_AVAILABLE = True
except ImportError:
    FAISS_AVAILABLE = False
    logger.warning("FAISS not installed - vector search disabled")

try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False
    logger.warning("sentence-transformers not installed")


class FAISSService:
    """
    FAISS Vector Database Service for RAG.
    
    Stores and retrieves market research documents using semantic search.
    """
    
    def __init__(self, index_path: str = "data/faiss_index"):
        self.index_path = Path(index_path)
        self.index_path.mkdir(parents=True, exist_ok=True)
        
        self.index_file = self.index_path / "index.faiss"
        self.metadata_file = self.index_path / "metadata.pkl"
        
        self.index = None
        self.metadata = []
        self.embedding_model = None
        
        if not FAISS_AVAILABLE or not SENTENCE_TRANSFORMERS_AVAILABLE:
            logger.warning("FAISS or sentence-transformers not available")
            return
        
        # Load embedding model
        try:
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
            logger.info("✅ Embedding model loaded")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
        
        # Load existing index if available
        self._load_index()
    
    def _load_index(self):
        """Load existing FAISS index and metadata."""
        if not FAISS_AVAILABLE:
            return
        
        try:
            if self.index_file.exists() and self.metadata_file.exists():
                self.index = faiss.read_index(str(self.index_file))
                with open(self.metadata_file, 'rb') as f:
                    self.metadata = pickle.load(f)
                logger.info(f"✅ Loaded FAISS index with {len(self.metadata)} documents")
            else:
                logger.info("No existing index found - will create new one")
        except Exception as e:
            logger.error(f"Error loading index: {e}")
    
    def _save_index(self):
        """Save FAISS index and metadata."""
        if not FAISS_AVAILABLE or self.index is None:
            return
        
        try:
            faiss.write_index(self.index, str(self.index_file))
            with open(self.metadata_file, 'wb') as f:
                pickle.dump(self.metadata, f)
            logger.info(f"✅ Saved FAISS index with {len(self.metadata)} documents")
        except Exception as e:
            logger.error(f"Error saving index: {e}")
    
    def add_documents(self, documents: List[Dict[str, str]]):
        """
        Add documents to FAISS index.
        
        Args:
            documents: List of dicts with 'text', 'source', 'metadata'
        """
        if not FAISS_AVAILABLE or not self.embedding_model:
            logger.warning("Cannot add documents - FAISS not available")
            return
        
        try:
            # Extract texts
            texts = [doc['text'] for doc in documents]
            
            # Generate embeddings
            logger.info(f"Generating embeddings for {len(texts)} documents...")
            embeddings = self.embedding_model.encode(texts, show_progress_bar=True)
            embeddings = np.array(embeddings).astype('float32')
            
            # Create or add to index
            if self.index is None:
                dimension = embeddings.shape[1]
                self.index = faiss.IndexFlatL2(dimension)
                logger.info(f"Created new FAISS index with dimension {dimension}")
            
            # Add embeddings
            self.index.add(embeddings)
            
            # Store metadata
            self.metadata.extend(documents)
            
            # Save
            self._save_index()
            
            logger.info(f"✅ Added {len(documents)} documents to index")
            
        except Exception as e:
            logger.error(f"Error adding documents: {e}")
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for relevant documents.
        
        Args:
            query: Search query
            k: Number of results to return
            
        Returns:
            List of relevant documents with scores
        """
        if not FAISS_AVAILABLE or not self.embedding_model or self.index is None:
            logger.warning("Cannot search - FAISS not available or no index")
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])
            query_embedding = np.array(query_embedding).astype('float32')
            
            # Search
            distances, indices = self.index.search(query_embedding, k)
            
            # Compile results
            results = []
            for i, idx in enumerate(indices[0]):
                if idx < len(self.metadata):
                    result = self.metadata[idx].copy()
                    result['score'] = float(distances[0][i])
                    results.append(result)
            
            logger.info(f"Found {len(results)} relevant documents")
            return results
            
        except Exception as e:
            logger.error(f"Search error: {e}")
            return []
    
    def search_market_data(self, structured_idea: Dict[str, Any]) -> str:
        """
        Search for relevant market data based on startup idea.
        
        Returns formatted string with retrieved documents.
        """
        if not FAISS_AVAILABLE or self.index is None:
            return "FAISS vector database not available or empty"
        
        # Build search query from idea
        problem = structured_idea.get('problem_statement', '')
        target = structured_idea.get('target_audience', '')
        solution = structured_idea.get('solution_description', '')
        
        query = f"{problem} {target} {solution} market size competitors"
        
        # Search
        results = self.search(query, k=5)
        
        if not results:
            return "No relevant documents found in vector database"
        
        # Format results
        retrieved_data = []
        for i, result in enumerate(results, 1):
            text = result.get('text', '')
            source = result.get('source', 'Unknown')
            score = result.get('score', 0)
            
            retrieved_data.append(f"[Document {i}] (Relevance: {score:.2f})")
            retrieved_data.append(f"Source: {source}")
            retrieved_data.append(f"{text}")
            retrieved_data.append("")
        
        return "\n".join(retrieved_data)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get index statistics."""
        if not FAISS_AVAILABLE or self.index is None:
            return {
                "available": False,
                "total_documents": 0
            }
        
        return {
            "available": True,
            "total_documents": len(self.metadata),
            "index_size": self.index.ntotal
        }