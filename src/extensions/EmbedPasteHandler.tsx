// extensions/embedPasteHandler.ts
import { Extension } from '@tiptap/core'
import { Plugin } from 'prosemirror-state'

export const EmbedPasteHandler = Extension.create({
  name: 'embedPasteHandler',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          handlePaste: async (view, event) => {
            const pastedText = event.clipboardData?.getData('text/plain')?.trim()
            if (!pastedText || !isValidUrl(pastedText)) return false

            event.preventDefault()

            const pos = view.state.selection.from

            // Insert "Loading preview..." + empty paragraph (TipTap chain)
            this.editor
              .chain()
              .focus()
              .insertContentAt(pos, [
                {
                  type: 'paragraph',
                  content: [
                    {
                      type: 'text',
                      text: 'Loading preview...',
                    },
                  ],
                },
                {
                  type: 'paragraph',
                  content: [],
                },
              ])
              .run()

            // Fetch metadata via API
            const metadata = await extractMetadataFromUrl(pastedText)
            if (!metadata) return true

            // Replace "Loading preview..." with embed + new paragraph
            // We'll find and delete "Loading preview..." manually
            const docText = this.editor.state.doc.textBetween(0, this.editor.state.doc.content.size, '\n', '\n')
            const loadingIndex = docText.indexOf('Loading preview...')
            const fromPos = loadingIndex >= 0 ? loadingIndex : pos

            this.editor
              .chain()
              .focus()
              .deleteRange({ from: fromPos, to: fromPos + 'Loading preview...'.length })
              .insertContentAt(fromPos, [
                {
                  type: 'linkPreview',
                  attrs: {
                    url: pastedText,
                    title: metadata?.title || pastedText,
                    description: metadata?.description || '',
                    image: metadata?.image || '',
                  },
                },
                {
                  type: 'paragraph',
                  content: [],
                },
              ])
              .focus(fromPos + 2) // move cursor into empty paragraph
              .run()

            return true
          },
        },
      }),
    ]
  },
})

function isValidUrl(url: string) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

async function extractMetadataFromUrl(url: string) {
  try {
    const res = await fetch('/api/fetchLinkPreview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })

    const data = await res.json()
    if (!data.success) {
      console.error('Metadata fetch failed:', data.error)
      return null
    }

    return data.preview
  } catch (error) {
    console.error('Error fetching metadata:', error)
    return null
  }
}
