declare global {
    interface Window {
        SpeechRecognition: SpeechRecognition
    }
    interface SpeechGrammar {
        src: string
        weight: number
    }

    const SpeechGrammar: {
        prototype: SpeechGrammar
        new(): SpeechGrammar
    }

    interface SpeechGrammarList {
        readonly length: number
        addFromString(string: string, weight?: number): void
        addFromURI(src: string, weight?: number): void
        item(index: number): SpeechGrammar
        [index: number]: SpeechGrammar
    }

    const SpeechGrammarList: {
        prototype: SpeechGrammarList
        new(): SpeechGrammarList
    }

    interface SpeechRecognitionEventMap {
        audioend: Event
        audiostart: Event
        end: Event
        error: SpeechRecognitionError
        nomatch: SpeechRecognitionEvent
        result: SpeechRecognitionEvent
        soundend: Event
        soundstart: Event
        speechend: Event
        speechstart: Event
        start: Event
    }

    interface SpeechRecognition {
        continuous: boolean
        grammars: SpeechGrammarList
        interimResults: boolean
        lang: string
        maxAlternatives: number
        onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
        onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
        onend: ((this: SpeechRecognition, ev: Event) => any) | null
        onerror:
        | ((this: SpeechRecognition, ev: SpeechRecognitionError) => any)
        | null
        onnomatch:
        | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
        | null
        onresult:
        | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
        | null
        onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
        onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
        onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
        onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
        onstart: ((this: SpeechRecognition, ev: Event) => any) | null
        serviceURI: string
        abort(): void
        start(): void
        stop(): void
        addEventListener<K extends keyof SpeechRecognitionEventMap>(
            type: K,
            listener: (
                this: SpeechRecognition,
                ev: SpeechRecognitionEventMap[K]
            ) => any,
            options?: boolean | AddEventListenerOptions
        ): void
        addEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | AddEventListenerOptions
        ): void
        removeEventListener<K extends keyof SpeechRecognitionEventMap>(
            type: K,
            listener: (
                this: SpeechRecognition,
                ev: SpeechRecognitionEventMap[K]
            ) => any,
            options?: boolean | EventListenerOptions
        ): void
        removeEventListener(
            type: string,
            listener: EventListenerOrEventListenerObject,
            options?: boolean | EventListenerOptions
        ): void
    }

    const SpeechRecognition: {
        prototype: SpeechRecognition
        new(): SpeechRecognition
    }

    interface SpeechRecognitionError extends Event {
        // readonly error: SpeechRecognitionErrorCode;
        readonly message: string
    }

    const SpeechRecognitionError: {
        prototype: SpeechRecognitionError
        new(): SpeechRecognitionError
    }

    interface SpeechRecognitionEvent extends Event {
        readonly emma: Document | null
        readonly interpretation: any
        readonly resultIndex: number
        readonly results: SpeechRecognitionResultList
    }

    const SpeechRecognitionEvent: {
        prototype: SpeechRecognitionEvent
        new(): SpeechRecognitionEvent
    }
}

let speechRecognition: SpeechRecognition

if (window.SpeechRecognition) {
    speechRecognition = new SpeechRecognition()
} else {
    speechRecognition = new webkitSpeechRecognition()
}

export { speechRecognition }