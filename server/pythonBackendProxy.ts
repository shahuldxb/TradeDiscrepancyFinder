/**
 * Python Backend Proxy Service
 * Integrates FastAPI Python backend with Node.js frontend
 * Provides seamless communication between React frontend and Python Azure services
 */

import { spawn, ChildProcess } from 'child_process';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { Readable } from 'stream';

export class PythonBackendProxy {
  private pythonProcess: ChildProcess | null = null;
  private isRunning = false;
  private readonly pythonBackendUrl = 'http://localhost:8000';
  private startupTimeout = 30000; // 30 seconds

  constructor() {
    this.startPythonBackend();
  }

  /**
   * Start the Python FastAPI backend process
   */
  private async startPythonBackend(): Promise<void> {
    try {
      console.log('Starting Python FastAPI backend...');
      
      this.pythonProcess = spawn('python', ['start-python-backend.py'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      this.pythonProcess.stdout?.on('data', (data) => {
        console.log(`Python Backend: ${data.toString()}`);
        if (data.toString().includes('Application startup complete')) {
          this.isRunning = true;
        }
      });

      this.pythonProcess.stderr?.on('data', (data) => {
        console.error(`Python Backend Error: ${data.toString()}`);
      });

      this.pythonProcess.on('close', (code) => {
        console.log(`Python backend process exited with code ${code}`);
        this.isRunning = false;
      });

      // Wait for backend to start up
      await this.waitForBackend();
      
    } catch (error) {
      console.error('Failed to start Python backend:', error);
      throw error;
    }
  }

  /**
   * Wait for Python backend to become available
   */
  private async waitForBackend(): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.startupTimeout) {
      try {
        const response = await fetch(`${this.pythonBackendUrl}/health`);
        if (response.ok) {
          console.log('Python backend is ready');
          this.isRunning = true;
          return;
        }
      } catch (error) {
        // Backend not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Python backend failed to start within timeout period');
  }

  /**
   * Check if Python backend is running
   */
  public isBackendRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Upload document to Python backend
   */
  public async uploadDocument(fileBuffer: Buffer, filename: string, contentType: string): Promise<any> {
    try {
      if (!this.isRunning) {
        throw new Error('Python backend is not running');
      }

      const formData = new FormData();
      const stream = Readable.from(fileBuffer);
      formData.append('file', stream, {
        filename: filename,
        contentType: contentType
      });

      const response = await fetch(`${this.pythonBackendUrl}/api/forms/upload`, {
        method: 'POST',
        body: formData as any,
        headers: formData.getHeaders()
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Document uploaded successfully:', result);
      return result;

    } catch (error) {
      console.error('Error uploading to Python backend:', error);
      throw error;
    }
  }

  /**
   * Get processing status from Python backend
   */
  public async getProcessingStatus(ingestionId: string): Promise<any> {
    try {
      if (!this.isRunning) {
        throw new Error('Python backend is not running');
      }

      const response = await fetch(`${this.pythonBackendUrl}/api/forms/status/${ingestionId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get status: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting processing status:', error);
      throw error;
    }
  }

  /**
   * Get all records from Python backend
   */
  public async getAllRecords(): Promise<any> {
    try {
      if (!this.isRunning) {
        throw new Error('Python backend is not running');
      }

      const response = await fetch(`${this.pythonBackendUrl}/api/forms/records`);
      
      if (!response.ok) {
        throw new Error(`Failed to get records: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Error getting records:', error);
      throw error;
    }
  }

  /**
   * Health check for Python backend
   */
  public async healthCheck(): Promise<any> {
    try {
      if (!this.isRunning) {
        return { status: 'offline', message: 'Python backend is not running' };
      }

      const response = await fetch(`${this.pythonBackendUrl}/health`);
      
      if (!response.ok) {
        return { status: 'error', message: `Health check failed: ${response.status}` };
      }

      return await response.json();

    } catch (error) {
      console.error('Health check error:', error);
      return { status: 'error', message: error.message };
    }
  }

  /**
   * Shutdown the Python backend
   */
  public shutdown(): void {
    if (this.pythonProcess) {
      console.log('Shutting down Python backend...');
      this.pythonProcess.kill('SIGTERM');
      this.isRunning = false;
    }
  }
}

// Singleton instance
export const pythonBackendProxy = new PythonBackendProxy();

// Graceful shutdown
process.on('SIGINT', () => {
  pythonBackendProxy.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  pythonBackendProxy.shutdown();
  process.exit(0);
});