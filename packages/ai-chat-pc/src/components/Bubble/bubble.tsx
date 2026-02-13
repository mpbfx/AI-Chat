import { UserOutlined } from '@ant-design/icons'
import { Bubble } from '@ant-design/x'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'

import { useChatStore, useConversationStore } from '@pc/store'

import { allMessageContent } from './content'
import { calculateVirtualRange } from './virtualList'

import type { MessageContent } from '@pc/types/chat'
import type { ComponentProps, UIEventHandler } from 'react'
import './bubble.css' // 添加CSS导入
import 'highlight.js/styles/github.css'

export const ChatBubble = () => {
  const listRef = useRef<HTMLDivElement>(null)
  const heightMapRef = useRef<Map<number, number>>(new Map())
  const stickToBottomRef = useRef(true)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)
  const [measureVersion, setMeasureVersion] = useState(0)
  const { messages } = useChatStore()
  const { selectedId } = useConversationStore()

  type BubbleProps = ComponentProps<typeof Bubble>
  type RoleConfig = Pick<BubbleProps, 'placement' | 'avatar' | 'variant' | 'style'>

  const roleConfigs: Record<'system' | 'user' | 'file' | 'image', RoleConfig> = {
    system: {
      placement: 'start',
      avatar: { icon: <UserOutlined />, style: { background: '#fde3cf' } },
      variant: 'borderless',
      style: {
        maxWidth: '100%'
      }
    },
    user: {
      placement: 'end',
      avatar: { icon: <UserOutlined />, style: { background: '#87d068' } }
    },
    file: {
      placement: 'end',
      variant: 'borderless'
    },
    image: {
      placement: 'end',
      variant: 'borderless'
    }
  }

  const chatMessage = selectedId ? (messages.get(selectedId) ?? []) : []

  // 渲染消息内容
  const renderMessageContent = (content: MessageContent[]) => {
    if (!content || content.length === 0) {
      return null
    }

    return content.map((item, index) => {
      return (
        <div key={index}>
          {/*  eslint-disable-next-line @typescript-eslint/no-explicit-any*/}
          {allMessageContent[item.type as keyof typeof allMessageContent](item as any)}
        </div>
      )
    })
  }

  useLayoutEffect(() => {
    if (!listRef.current) {
      return
    }

    const node = listRef.current
    const updateViewport = () => setViewportHeight(node.clientHeight)

    updateViewport()

    const observer = new ResizeObserver(updateViewport)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    heightMapRef.current.clear()
    setMeasureVersion(0)
    setScrollTop(0)
    stickToBottomRef.current = true
  }, [selectedId])

  const virtualRange = useMemo(
    () =>
      calculateVirtualRange({
        itemCount: chatMessage.length,
        scrollTop,
        viewportHeight,
        overscan: 3,
        estimateHeight: 96,
        heightMap: heightMapRef.current
      }),
    [chatMessage.length, scrollTop, viewportHeight, measureVersion]
  )

  const visibleItems = useMemo(() => {
    if (virtualRange.endIndex < virtualRange.startIndex) {
      return []
    }

    return chatMessage
      .slice(virtualRange.startIndex, virtualRange.endIndex + 1)
      .map((message, offset) => ({
        index: virtualRange.startIndex + offset,
        message
      }))
  }, [chatMessage, virtualRange.startIndex, virtualRange.endIndex])

  useEffect(() => {
    if (!listRef.current || !stickToBottomRef.current) {
      return
    }

    const node = listRef.current
    node.scrollTop = node.scrollHeight
  }, [selectedId, chatMessage.length, measureVersion])

  const handleScroll: UIEventHandler<HTMLDivElement> = (event) => {
    const node = event.currentTarget
    setScrollTop(node.scrollTop)

    const distanceToBottom = node.scrollHeight - node.clientHeight - node.scrollTop
    stickToBottomRef.current = distanceToBottom < 120
  }

  const setMeasuredHeight = (index: number, node: HTMLDivElement | null) => {
    if (!node) {
      return
    }

    const nextHeight = node.offsetHeight
    const prevHeight = heightMapRef.current.get(index)
    if (!prevHeight || Math.abs(prevHeight - nextHeight) > 1) {
      heightMapRef.current.set(index, nextHeight)
      setMeasureVersion((version) => version + 1)
    }
  }

  return (
    <div
      ref={listRef}
      className="chat-bubble-list"
      style={{
        paddingInline: 16,
        height: '100%',
        width: '50vw',
        overflowY: 'auto', // 确保可以滚动但滚动条被CSS隐藏
        paddingBottom: '25%'
      }}
      onScroll={handleScroll}>
      <div style={{ height: `${virtualRange.paddingTop}px` }} />
      {visibleItems.map(({ index, message }) => (
        <div key={index} ref={(node) => setMeasuredHeight(index, node)}>
          <Bubble {...roleConfigs[message.role]} content={renderMessageContent(message.content)} />
        </div>
      ))}
      <div style={{ height: `${virtualRange.paddingBottom}px` }} />
    </div>
  )
}
