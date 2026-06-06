import { useRef, useState } from 'react'
import ReactQuill from 'react-quill'
import type { ReactQuillProps } from 'react-quill'
import { message } from 'antd'
import { fileApi } from '@/api'

interface QuillEditorProps extends Omit<ReactQuillProps, 'onChange'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  readOnly?: boolean
}

const QuillEditor = ({
  value,
  onChange,
  placeholder = '请输入内容...',
  readOnly = false,
  ...rest
}: QuillEditorProps) => {
  const quillRef = useRef<ReactQuill>(null)
  const [uploading, setUploading] = useState(false)

  const modules = {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ color: [] }, { background: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],
        [{ align: [] }],
        ['link', 'image'],
        ['blockquote', 'code-block'],
        ['clean'],
      ],
      handlers: {
        image: handleImageUpload,
      },
    },
  }

  const formats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'list',
    'bullet',
    'indent',
    'align',
    'link',
    'image',
    'blockquote',
    'code-block',
  ]

  async function handleImageUpload() {
    if (uploading) return

    const input = document.createElement('input')
    input.setAttribute('type', 'file')
    input.setAttribute('accept', 'image/*')
    input.click()

    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        message.error('请选择图片文件')
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        message.error('图片大小不能超过 5MB')
        return
      }

      try {
        setUploading(true)
        const result = await fileApi.uploadFile(file)
        const quill = quillRef.current?.getEditor()
        if (quill) {
          const range = quill.getSelection()
          const index = range ? range.index : quill.getLength() - 1
          quill.insertEmbed(Math.max(0, index), 'image', result.url)
          quill.setSelection(index + 1, 0)
        }
        message.success('图片上传成功')
      } catch (error) {
        console.error('Image upload error:', error)
        message.error('图片上传失败，请重试')
      } finally {
        setUploading(false)
      }
    }
  }

  return (
    <div className="quill-editor-wrapper">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
        {...rest}
      />
    </div>
  )
}

export default QuillEditor
