import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Get the filename from the URL parameters
    const { filename } = params

    // Construct the path to the uploaded PDF file
    // This should match where your Flask backend stores uploaded files
    const filePath = path.join(process.cwd(), '..', 'uploaded_documents', filename)

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found at path: ${filePath}`)
      return new NextResponse('File not found', { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error serving PDF:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 