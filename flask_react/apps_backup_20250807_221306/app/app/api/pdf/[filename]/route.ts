import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    // Validate and sanitize filename parameter
    const { filename } = params
    if (!filename || typeof filename !== 'string') {
      return NextResponse.json({ error: 'Missing filename parameter' }, { status: 400 })
    }

    const safeName = path.basename(filename)
    const isPdf = safeName.toLowerCase().endsWith('.pdf')
    const isSafe = /^[a-zA-Z0-9._-]+$/.test(safeName)

    if (!isPdf || !isSafe) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }

    // Construct and verify absolute path to prevent path traversal
    const baseDir = path.resolve(process.cwd(), '..', 'uploaded_documents')
    const filePath = path.join(baseDir, safeName)
    const resolvedPath = path.resolve(filePath)
    if (!resolvedPath.startsWith(baseDir + path.sep)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read the file
    const fileBuffer = fs.readFileSync(filePath)

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${safeName}"`,
      },
    })
  } catch (error) {
    console.error('Error serving PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 