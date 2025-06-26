import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { auth } from "@/auth"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File
    const fileType: string = data.get('fileType') as string || 'video'

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      )
    }

    // Define allowed file types for each category
    const allowedTypes: { [key: string]: string[] } = {
      video: ['video/mp4', 'video/webm', 'video/ogg'],
      pdf: ['application/pdf']
    }

    // Validate file type
    if (!allowedTypes[fileType] || !allowedTypes[fileType].includes(file.type)) {
      const allowedExtensions: { [key: string]: string } = {
        video: "MP4, WebM, OGG",
        pdf: "PDF"
      }
      return NextResponse.json(
        { error: `Invalid file type. Only ${allowedExtensions[fileType] || "supported"} files are allowed.` },
        { status: 400 }
      )
    }

    // Define file size limits (in bytes)
    const maxSizes: { [key: string]: number } = {
      video: 100 * 1024 * 1024, // 100MB
      pdf: 50 * 1024 * 1024     // 50MB
    }

    // Validate file size
    if (file.size > maxSizes[fileType]) {
      const maxSizeMB = maxSizes[fileType] / (1024 * 1024)
      return NextResponse.json(
        { error: `File too large. Maximum size is ${maxSizeMB}MB.` },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const filename = `${fileType}_${timestamp}.${extension}`
    
    // Save to appropriate directory
    const uploadDir = join(process.cwd(), 'public', 'uploads', fileType + 's')
    const filePath = join(uploadDir, filename)
    
    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }
    
    await writeFile(filePath, buffer)
    
    // Return the public URL
    const publicUrl = `/uploads/${fileType}s/${filename}`
    
    return NextResponse.json({
      success: true,
      filename,
      url: publicUrl,
      size: file.size,
      type: file.type,
      fileType
    })

  } catch (error) {
    console.error("Error uploading file:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}