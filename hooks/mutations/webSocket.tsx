import { useEffect, useRef, useState } from 'react'

interface UseWebSocketProps {
  roomId: string
  token: string
  onMessageReceived?: (message: any) => void // Accept any message format
  onConnectionChange?: (isConnected: boolean) => void
}

export const useWebSocket = ({ 
  roomId, 
  token, 
  onMessageReceived, 
  onConnectionChange 
}: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null)

  const connect = () => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)
    
    try {
      const wsUrl = `ws://movbay.com/ws/chat/${roomId}/?token=${token}`
      console.log('Connecting to WebSocket:', wsUrl)
      
      ws.current = new WebSocket(wsUrl)

      ws.current.onopen = () => {
        console.log('WebSocket connected successfully')
        setIsConnected(true)
        setIsConnecting(false)
        reconnectAttempts.current = 0
        onConnectionChange?.(true)
      }

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('Received message:', data)
          onMessageReceived?.(data)
        } catch (error) {
          console.error('Error parsing WebSocket message:', error)
        }
      }

      ws.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason)
        setIsConnected(false)
        setIsConnecting(false)
        onConnectionChange?.(false)
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000)
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1})`)
          
          reconnectTimeout.current = setTimeout(() => {
            reconnectAttempts.current++
            connect()
          }, delay)
        }
      }

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setIsConnecting(false)
      }

    } catch (error) {
      console.error('Error creating WebSocket connection:', error)
      setIsConnecting(false)
    }
  }

  const disconnect = () => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current)
      reconnectTimeout.current = null
    }
    
    if (ws.current) {
      ws.current.close(1000, 'User disconnected')
      ws.current = null
    }
    
    setIsConnected(false)
    setIsConnecting(false)
    reconnectAttempts.current = 0
  }

  const sendMessage = (messageContent: string, imageUrl?: string) => {
    if (!isConnected || !ws.current) {
      console.warn('WebSocket not connected, cannot send message')
      return false
    }

    try {
      const messageData = {
        content: messageContent,
        type: 'chat_message',
        timestamp: new Date().toISOString(),
        ...(imageUrl && { image_url: imageUrl })
      }

      ws.current.send(JSON.stringify(messageData))
      console.log('Message sent:', messageData)
      return true
    } catch (error) {
      console.error('Error sending message:', error)
      return false
    }
  }

  const retry = () => {
    reconnectAttempts.current = 0
    connect()
  }

  useEffect(() => {
    if (roomId && token) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [roomId, token])

  return {
    isConnected,
    isConnecting,
    sendMessage,
    disconnect,
    retry,
    reconnectAttempts: reconnectAttempts.current,
    maxReconnectAttempts
  }
}