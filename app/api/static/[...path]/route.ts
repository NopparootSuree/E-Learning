import { NextRequest, NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import mime from "mime-types"

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const filePath = join(process.cwd(), 'public', 'uploads', ...params.path)
    
    // Check if file exists
    if (!existsSync(filePath)) {
      return new NextResponse("File not found", { status: 404 })
    }

    // Security check - ensure path is within uploads directory
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    if (!filePath.startsWith(uploadsDir)) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    // Read file
    const fileBuffer = await readFile(filePath)
    
    // Get MIME type
    const mimeType = mime.lookup(filePath) || 'application/octet-stream'
    
    // Create response with appropriate headers
    const response = new NextResponse(fileBuffer)
    response.headers.set('Content-Type', mimeType)
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    // For videos, add additional headers
    if (mimeType.startsWith('video/')) {
      response.headers.set('Accept-Ranges', 'bytes')
    }
    
    return response

  } catch (error) {
    console.error("Error serving static file:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}