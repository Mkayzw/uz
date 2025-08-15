import { Metadata } from 'next'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.NEXT_PUBLIC_VERCEL_URL || 'localhost'}`
const PUBLIC_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_PUBLIC_BUCKET || 'public'

async function fetchProperty(id: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?id=eq.${id}&select=*`,
    {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    }
  )

  if (!res.ok) return null
  const data = await res.json()
  return data[0] ?? null
}

function resolveImageUrl(imagePath?: string | null) {
  if (!imagePath) return `${APP_URL}/file.svg`
  // already an absolute URL
  if (imagePath.startsWith('http')) return imagePath
  // Assume it's a storage path in the public Supabase bucket
  return `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/${PUBLIC_BUCKET}/${imagePath.replace(/^\/+/, '')}`
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const property = await fetchProperty(params.id)
  if (!property) {
    return { title: 'Property' }
  }

  const title = property.title || 'Property'
  const description = (property.description || '').slice(0, 160) || `${property.city || ''}`
  const image = resolveImageUrl(Array.isArray(property.images) ? property.images[0] : property.images)
  const url = `${APP_URL.replace(/\/$/, '')}/p/${params.id}`

  return {
    title,
    description,
    metadataBase: new URL(APP_URL),
    openGraph: {
      title,
      description,
      url,
      images: image ? [{ url: image, alt: title }] : undefined,
      siteName: 'UniStay',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function Page({ params }: { params: { id: string } }) {
  const property = await fetchProperty(params.id)
  if (!property) return (
    <main style={{ padding: 24 }}>
      <h1>Property not found</h1>
    </main>
  )

  const image = resolveImageUrl(Array.isArray(property.images) ? property.images[0] : property.images)
  const url = `${APP_URL.replace(/\/$/, '')}/p/${params.id}`
  const shareText = `${property.title} — ${url}`

  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <article style={{ maxWidth: 900 }}>
        <h1 style={{ marginBottom: 8 }}>{property.title}</h1>
        <p style={{ color: '#666', marginTop: 0 }}>{property.city}{property.address ? ` — ${property.address}` : ''}</p>

        <div style={{ marginTop: 16 }}>
          <img src={image} alt={property.title} style={{ width: '100%', maxHeight: 420, objectFit: 'cover', borderRadius: 8 }} />
        </div>

        <section style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 18 }}>About</h2>
          <p style={{ color: '#333' }}>{property.description}</p>
        </section>

        <section style={{ marginTop: 20, display: 'flex', gap: 8 }}>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#25D366',
              color: '#fff',
              padding: '10px 14px',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Share on WhatsApp
          </a>

          <a
            href={url}
            style={{
              background: '#eef2ff',
              color: '#3730a3',
              padding: '10px 14px',
              borderRadius: 6,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Copy link
          </a>
        </section>

      </article>
    </main>
  )
}
