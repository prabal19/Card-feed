import { FaInstagram, FaYoutube, FaTwitter, FaLink } from 'react-icons/fa'

type Props = {
  title: string
  description?: string
  image?: string
  url: string
}

function getPlatformIcon(url: string) {
  if (url.includes('instagram.com')) return <FaInstagram className="text-pink-600 w-8 h-8 flex-shrink-0" />
  if (url.includes('youtube.com') || url.includes('youtu.be')) return <FaYoutube className="text-red-600 w-8 h-8 flex-shrink-0" />
  if (url.includes('twitter.com') || url.includes('x.com')) return <FaTwitter className="text-blue-500 w-8 h-8 flex-shrink-0" />
  return <FaLink className="text-gray-500 w-8 h-8 flex-shrink-0" />
}

export default function LinkPreview({ title, description, image, url }: Props) {
  const hasImage = !!image?.trim()

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="embed block mx-auto my-5 w-full max-w-lg border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition p-4 bg-white"
    >
      {hasImage ? (
        <>
          <img
            src={image}
            alt={title}
            className="w-full h-80 object-contain rounded-md mb-3"
          />
          <div className="flex items-start space-x-3">
          {getPlatformIcon(url)}
          <div className="flex flex-col">
            <div className="text-lg font-bold text-gray-800 truncate text-wrap">{title}</div>
            {description && (
              <p className="text-sm leading-snug text-gray-600 line-clamp-2 text-wrap">{description}</p>
            )}
          </div>
        </div>
        </>
      ) : (
        <div className="flex items-start space-x-3">
          {getPlatformIcon(url)}
          <div className="flex flex-col">
            <div className="text-lg font-bold text-gray-800 truncate">{title}</div>
            {description && (
              <p className="text-sm leading-snug text-gray-600 line-clamp-2">{description}</p>
            )}
          </div>
        </div>
      )}
    </a>
  )
}
