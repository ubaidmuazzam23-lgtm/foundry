# File: backend/app/utils/logger.py
# Logging configuration

import logging
import sys
from app.config import settings

# Configure logger
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger("startup_builder")