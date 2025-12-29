
export enum VideoStatus {
  PENDING = 'PENDING',
  PROCESSING_FFMPEG = 'PROCESSING_FFMPEG', // Removing watermark, Compressing
  GENERATING_METADATA = 'GENERATING_METADATA', // Gemini AI
  READY_FOR_REVIEW = 'READY_FOR_REVIEW', // Waiting for human approval
  UPLOADING_R2 = 'UPLOADING_R2', // Final Upload
  PUBLISHED = 'PUBLISHED', // Done
  ERROR = 'ERROR'
}

export interface VideoAsset {
  id: string;
  file?: File; // Keep reference to file for preview
  filename: string;
  size: string;
  compressedSize?: string; // New: Size after compression
  hlsUrl?: string; // New: Final HLS Link (m3u8)
  status: VideoStatus;
  progress: number;
  url?: string;
  thumbnail?: string;
  metadata?: {
    title: string;
    description: string;
    tags: string[];
    category?: string; // New Category Field
    aiGenerated: boolean;
    cropBottom?: number; // Pixels to cut from bottom
    isShorts?: boolean; // If true, target 9:16
  };
  uploadDate: Date;
}

export interface GeminiMetadataResponse {
  title: string;
  description: string;
  tags: string[];
}

export type ViewMode = 'ADMIN' | 'CONSUMER' | 'BACKEND_GUIDE' | 'SETTINGS' | 'APK_MANAGER';
