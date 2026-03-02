import { create } from 'zustand';
import { chatService } from '../services/chatService';

interface ChatState {
  rooms: any[];
  messages: any[];
  isLoading: boolean;
  fetchRooms: () => Promise<void>;
  fetchMessages: (roomId: string) => Promise<void>;
  sendMessage: (roomId: string, content: string) => Promise<void>;
  addMessage: (message: any) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messages: [],
  isLoading: false,

  fetchRooms: async () => {
    set({ isLoading: true });
    try {
      const { data } = await chatService.getRooms();
      set({ rooms: data.data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchMessages: async (roomId) => {
    set({ isLoading: true });
    try {
      const { data } = await chatService.getMessages(roomId);
      set({ messages: data.data || [], isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  sendMessage: async (roomId, content) => {
    const { data } = await chatService.sendMessage(roomId, content);
    set({ messages: [...get().messages, data.data] });
  },

  addMessage: (message) => {
    set({ messages: [...get().messages, message] });
  },
}));
