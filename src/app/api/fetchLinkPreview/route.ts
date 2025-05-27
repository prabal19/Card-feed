import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { url } = await req.json()

  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
    const data = await res.json()

    if (!data?.data?.title) {
      return NextResponse.json({ success: false, error: 'No preview available' })
    }

    return NextResponse.json({
      success: true,
      preview: {
        title: data.data.title,
        description: data.data.description,
        image: data.data.image?.url,
        url: data.data.url,
        logo: data.data.logo?.url,
      },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch preview' })
  }
}
