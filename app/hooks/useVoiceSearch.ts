'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Web Speech API 기반 음성 검색 훅
 *
 * - Chrome/Edge: 완벽 지원 (Google 음성인식 서버)
 * - Safari: 기본 지원 (간혹 불안정)
 * - Firefox: 미지원 → isSupported = false
 * - 비용: $0 (브라우저 내장)
 */

interface UseVoiceSearchOptions {
  /** 음성 인식 언어 (기본: en-US) */
  lang?: string;
  /** 인식된 텍스트를 반영할 콜백 */
  onResult?: (transcript: string) => void;
  /** 음성 인식이 끝났을 때 콜백 */
  onEnd?: () => void;
}

interface UseVoiceSearchReturn {
  /** 브라우저가 Web Speech API를 지원하는지 */
  isSupported: boolean;
  /** 현재 녹음 중인지 */
  isListening: boolean;
  /** 실시간 인식 결과 (interim) */
  transcript: string;
  /** 녹음 시작 */
  startListening: () => void;
  /** 녹음 중지 */
  stopListening: () => void;
  /** 녹음 토글 (시작/중지) */
  toggleListening: () => void;
}

// SpeechRecognition 타입 (브라우저마다 prefix가 다름)
type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any;

function getSpeechRecognition(): SpeechRecognitionType | null {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function useVoiceSearch(options: UseVoiceSearchOptions = {}): UseVoiceSearchReturn {
  const { lang = 'en-US', onResult, onEnd } = options;

  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // 브라우저 지원 여부 확인
  useEffect(() => {
    setIsSupported(!!getSpeechRecognition());
  }, []);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    // 기존 인스턴스 정리
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;      // 한 문장 인식 후 자동 종료
    recognition.interimResults = true;   // 실시간 중간 결과 표시
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('');
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      // 최종 결과가 나오면 콜백 호출
      if (finalTranscript) {
        onResult?.(finalTranscript.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('🎤 [VoiceSearch] Error:', event.error);
      setIsListening(false);
      // 'not-allowed' 에러는 마이크 권한 거부
      // 'no-speech' 에러는 음성이 감지되지 않음
    };

    recognition.onend = () => {
      setIsListening(false);
      onEnd?.();
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch (err) {
      console.warn('🎤 [VoiceSearch] Failed to start:', err);
      setIsListening(false);
    }
  }, [lang, onResult, onEnd]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    toggleListening,
  };
}
