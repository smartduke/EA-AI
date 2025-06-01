import { type NextRequest, NextResponse } from 'next/server';
import { geolocation } from '@vercel/functions';

interface GeoLocation {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Use Vercel's geolocation function for accurate location detection
    const { longitude, latitude, city, country } = geolocation(request);

    // Get the client's IP address from headers for reference
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

    // Check if we're running in local development
    const isLocalDevelopment = !longitude && !latitude;

    // For local development, return a default location (India)
    if (isLocalDevelopment) {
      console.log('Using default India location for local development');
      return NextResponse.json({
        ip: ipAddress,
        country: 'India',
        city: 'New Delhi',
        region: 'Delhi',
        latitude: 28.6139,
        longitude: 77.209,
        isDefaultLocation: true,
      });
    }

    // For production, use Vercel's accurate geolocation data
    console.log('Using Vercel geolocation data:', {
      city,
      country,
      latitude,
      longitude,
    });
    return NextResponse.json({
      ip: ipAddress,
      city: city || undefined,
      region: undefined, // Vercel doesn't provide region, but we can use city
      country: country || undefined,
      latitude: latitude ? Number.parseFloat(latitude) : undefined,
      longitude: longitude ? Number.parseFloat(longitude) : undefined,
      isDefaultLocation: false,
    } as GeoLocation);
  } catch (error) {
    console.error('Error fetching geolocation data:', error);

    // Return default data on error
    return NextResponse.json({
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      country: 'India',
      city: 'New Delhi',
      region: 'Delhi',
      latitude: 28.6139,
      longitude: 77.209,
      isDefaultLocation: true,
    });
  }
}
