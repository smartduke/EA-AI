import { type NextRequest, NextResponse } from 'next/server';

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
    // Get the client's IP address from headers
    // In production, this will often be in X-Forwarded-For header
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ipAddress = forwardedFor ? forwardedFor.split(',')[0] : null;
    
    // Check if we're running in local development (localhost/127.0.0.1/::1)
    const isLocalDevelopment = !ipAddress || 
      ipAddress === '127.0.0.1' || 
      ipAddress === '::1' || 
      ipAddress === 'localhost';
    
    // For local development, return a default location (India)
    if (isLocalDevelopment) {
      console.log('Using default India location for local development');
      return NextResponse.json({
        ip: ipAddress || '127.0.0.1',
        country: 'India',     // Default country set to India
        city: 'New Delhi',    // Default city 
        region: 'Delhi',      // Default region
        isDefaultLocation: true   // Flag to indicate this is a default location
      });
    }
    
    // For production, use an actual IP geolocation service
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`);
    
    if (!response.ok) {
      console.log('Geolocation API failed, using default location');
      // Fallback to a default location if the geolocation service fails
      return NextResponse.json({
        ip: ipAddress,
        country: 'India',
        city: 'Mumbai',
        region: 'Maharashtra',
        isDefaultLocation: true
      });
    }
    
    const data = await response.json();
    
    // Return geolocation data
    return NextResponse.json({
      ip: ipAddress,
      city: data.city,
      region: data.region,
      country: data.country_name,
      latitude: data.latitude,
      longitude: data.longitude,
      isDefaultLocation: false
    } as GeoLocation);
  } catch (error) {
    console.error('Error fetching geolocation data:', error);
    
    // Return default data on error
    return NextResponse.json({
      ip: request.headers.get('x-forwarded-for') || '127.0.0.1',
      country: 'India',
      city: 'Mumbai',
      region: 'Maharashtra',
      isDefaultLocation: true
    });
  }
}