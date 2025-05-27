import { Node, mergeAttributes, ReactNodeViewRenderer, NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import LinkPreview from '@/components/create-post/LinkPreview'

// This component adapts NodeViewProps from Tiptap to your LinkPreview props
const WrappedLinkPreview = (props: NodeViewProps) => {
  const attrs = props.node.attrs

  return (
    <NodeViewWrapper>
      <LinkPreview
        title={attrs.title}
        description={attrs.description}
        image={attrs.image}
        url={attrs.url}
      />
    </NodeViewWrapper>
  )
}

export const LinkPreviewNode = Node.create({
  name: 'linkPreview',
  group: 'block',
  atom: true,

  addAttributes() {
    return {
      title: {
        default: '',
      },
      description: {
        default: '',
      },
      image: {
        default: '',
      },
      url: {
        default: '',
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-link-preview]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-link-preview': '' })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(WrappedLinkPreview)
  },
})
