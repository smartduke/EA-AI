import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Maximum file size for images (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// List of allowed image content types
const ALLOWED_CONTENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif'
];

// Secret key for validating hash signatures
// In production, use a secure environment variable
const SECRET_KEY = process.env.IMAGE_PROXY_SECRET || 'infoxai-secure-image-proxy';

export async function GET(request: NextRequest) {
  try {
    // Get the URL and hash from query parameters
    const searchParams = request.nextUrl.searchParams;
    const imageUrl = searchParams.get('url');
    const providedHash = searchParams.get('h');

    // If URL is missing, return 400 Bad Request
    if (!imageUrl) {
      return new NextResponse('Missing URL parameter', { status: 400 });
    }

    // If hash is missing, return 400 Bad Request
    if (!providedHash) {
      return new NextResponse('Missing hash parameter', { status: 400 });
    }
    
    // Verify the hash to prevent URL tampering
    const expectedHash = crypto
      .createHmac('sha256', SECRET_KEY)
      .update(imageUrl)
      .digest('hex');
      
    if (providedHash !== expectedHash) {
      return new NextResponse('Invalid hash', { status: 403 });
    }

    // Ensure the URL is properly formatted with a protocol
    let formattedImageUrl = imageUrl;
    if (!formattedImageUrl.startsWith('http://') && !formattedImageUrl.startsWith('https://')) {
      formattedImageUrl = 'https://' + formattedImageUrl;
    }

    console.log(`Image proxy fetching: ${formattedImageUrl}`);
    
    // Fetch the image
    const response = await fetch(formattedImageUrl, {
      headers: {
        // Set a proper User-Agent to avoid being blocked
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      },
    });

    // Check if the fetch was successful
    if (!response.ok) {
      return new NextResponse(`Failed to fetch image: ${response.statusText}`, {
        status: response.status,
      });
    }

    // Get content type and size
    const contentType = response.headers.get('content-type') || '';
    const contentLength = parseInt(response.headers.get('content-length') || '0', 10);

    // Validate content type
    if (!ALLOWED_CONTENT_TYPES.some(type => contentType.startsWith(type))) {
      return new NextResponse('Unsupported image format', { status: 415 });
    }

    // Check file size
    if (contentLength > MAX_FILE_SIZE) {
      return new NextResponse('Image too large', { status: 413 });
    }

    // Read the response as an array buffer
    const imageBuffer = await response.arrayBuffer();

    // Return the proxied image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error('Image proxy error:', error);
    return new NextResponse(`Error proxying image: ${error.message}`, { status: 500 });
  }
}