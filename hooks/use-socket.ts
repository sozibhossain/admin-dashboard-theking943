'use client';

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import io, { Socket } from "socket.io-client";

let socketInstance: Socket | null = null;

export const useSocket = () => {
  const { data: session } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    // Create socket connection if it doesn't exist
    if (!socketInstance) {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
      
      socketInstance = io(socketUrl, {
        query: {
          userId: session.user.id,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      socketInstance.on("connect", () => {
        console.log("[v0] Socket connected:", socketInstance?.id);
        setIsConnected(true);
        
        // Join notification room
        socketInstance?.emit("joinNotifications", session?.user?.id);
        socketInstance?.emit("joinAlerts");
      });

      socketInstance.on("disconnect", () => {
        console.log("[v0] Socket disconnected");
        setIsConnected(false);
      });

      socketInstance.on("connect_error", (error) => {
        console.log("[v0] Socket connection error:", error);
      });
    }

    setSocket(socketInstance);

    return () => {
      // Don't disconnect on unmount to keep listening for notifications
    };
  }, [session?.user?.id]);

  return { socket, isConnected };
};
