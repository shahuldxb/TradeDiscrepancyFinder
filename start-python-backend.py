#!/usr/bin/env python3
"""
FastAPI Backend Startup Script for Azure Forms Recognition
Runs alongside the Node.js frontend to provide Python-based Azure services
"""

import os
import sys
import subprocess
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_python_dependencies():
    """Check and install required Python packages"""
    required_packages = [
        'fastapi',
        'uvicorn',
        'python-multipart',
        'python-dotenv',
        'pyodbc',
        'azure-storage-blob',
        'azure-ai-documentintelligence',
        'azure-core',
        'PyMuPDF',
        'opencv-python',
        'Pillow',
        'numpy',
        'requests',
        'pydantic',
        'sqlalchemy',
        'aiofiles'
    ]
    
    logger.info("Checking Python dependencies...")
    
    missing_packages = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.info(f"Installing missing packages: {missing_packages}")
        for package in missing_packages:
            try:
                subprocess.check_call([sys.executable, '-m', 'pip', 'install', package])
                logger.info(f"Successfully installed {package}")
            except subprocess.CalledProcessError as e:
                logger.error(f"Failed to install {package}: {e}")
                return False
    
    logger.info("All Python dependencies are satisfied")
    return True

def check_environment_variables():
    """Check required environment variables"""
    required_vars = [
        'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT',
        'AZURE_DOCUMENT_INTELLIGENCE_KEY',
        'AZURE_SQL_SERVER',
        'AZURE_SQL_DATABASE',
        'AZURE_SQL_USERNAME',
        'AZURE_SQL_PASSWORD'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        logger.warning(f"Missing environment variables: {missing_vars}")
        logger.info("Some Azure services may not work properly without these variables")
    else:
        logger.info("All required environment variables are set")
    
    return len(missing_vars) == 0

def start_fastapi_server():
    """Start the FastAPI backend server"""
    try:
        logger.info("Starting FastAPI backend server on port 8000...")
        
        # Import and run the FastAPI app
        import uvicorn
        
        # Run the server
        uvicorn.run(
            "server.pythonBackend:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            log_level="info",
            access_log=True
        )
        
    except Exception as e:
        logger.error(f"Failed to start FastAPI server: {e}")
        return False
    
    return True

def main():
    """Main startup function"""
    logger.info("=== Azure Forms Recognition Python Backend Startup ===")
    
    # Check dependencies
    if not check_python_dependencies():
        logger.error("Failed to install required dependencies")
        sys.exit(1)
    
    # Check environment
    env_ok = check_environment_variables()
    if not env_ok:
        logger.warning("Some environment variables are missing - continuing anyway")
    
    # Start FastAPI server
    logger.info("Backend services ready - starting FastAPI server...")
    start_fastapi_server()

if __name__ == "__main__":
    main()