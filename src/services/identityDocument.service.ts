export interface IdentityDocument {
  id: number;
  reservationId: number;
  guestId: number;
  documentType: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  uploadDate: string;
  uploadedByUserId?: number;
  uploadedByUserName?: string;
  imageUrl?: string;
}

export interface CreateIdentityDocumentDto {
  reservationId: number;
  guestId: number;
  documentType: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: File;
}

export interface IdentityDocumentValidationResult {
  isValid: boolean;
  errorMessage: string;
  errorCode?: string;
}

class IdentityDocumentService {
  private baseUrl = "/IdentityDocuments";
  private API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5134/api';

  async uploadDocument(file: File, reservationId: number, guestId: number, documentType: string): Promise<IdentityDocument> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("reservationId", reservationId.toString());
    formData.append("guestId", guestId.toString());
    formData.append("documentType", documentType);

    const response = await fetch(`${this.API_URL}${this.baseUrl}/upload`, {
      method: 'POST',
      headers: {
        ...(typeof window !== 'undefined' && localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
      },
      body: formData,
    });
    
    if (!response.ok) {
      let errorMessage = 'Upload failed';
      try {
        const error = await response.json();
        errorMessage = error.message || error.detail || error.title || 'Upload failed';
      } catch (e) {
        errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }
    
    return await response.json();
  }

  async updateDocument(id: number, file: File): Promise<IdentityDocument> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.API_URL}${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: {
        ...(typeof window !== 'undefined' && localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.detail || 'Update failed');
    }
    
    return await response.json();
  }

  async deleteDocument(id: number): Promise<boolean> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`${this.API_URL}${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to delete document: ${response.statusText}`);
    }
    
    return true;
  }

  async getDocumentsByReservation(reservationId: number): Promise<IdentityDocument[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`${this.API_URL}${this.baseUrl}/reservation/${reservationId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get documents: ${response.statusText}`);
    }
    
    const data = await response.json();
    const documents = data.data || data;
    console.log('[identityDocumentService] API Response:', data);
    console.log('[identityDocumentService] Documents:', documents);
    return documents;
  }

  async getDocumentsByGuest(guestId: number): Promise<IdentityDocument[]> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`${this.API_URL}${this.baseUrl}/guest/${guestId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get documents: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.data || data;
  }

  async downloadDocument(id: number): Promise<Blob> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    const response = await fetch(`${this.API_URL}${this.baseUrl}/${id}/download`, {
      method: 'GET',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to download document: ${response.statusText}`);
    }
    
    return await response.blob();
  }

  async validateDocument(file: File): Promise<IdentityDocumentValidationResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${this.API_URL}${this.baseUrl}/validate`, {
      method: 'POST',
      headers: {
        ...(typeof window !== 'undefined' && localStorage.getItem('token') && { Authorization: `Bearer ${localStorage.getItem('token')}` }),
      },
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.detail || 'Validation failed');
    }
    
    return await response.json();
  }

  getDocumentUrl(filePath: string): string {
    // Construct the full URL for accessing the uploaded file
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5134";
    return `${baseUrl}/uploads/${filePath}`;
  }
}

export const identityDocumentService = new IdentityDocumentService();