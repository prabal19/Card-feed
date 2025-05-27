type Props = {
  title: string
  description?: string
  image?: string
  url: string
}

export default function LinkPreview({ title, description, image, url }: Props) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="embed block mx-auto w-full max-w-lg min-h-96 border rounded-lg overflow-hidden shadow-md hover:shadow-lg transition p-2 space-y-2 bg-white"
    >
      {image && (
        <img
          src={image}
          alt={title}
          className="w-full h-80 object-contain rounded-md" 
        />
      )}
      <div className="text-lg font-bold text-gray-800 truncate"> 
        {title}
      </div>
      {description && (
        <p className="text-sm leading-snug text-gray-600 line-clamp-2 "> 
          {description}
        </p>
      )}
    </a>
  )
}
