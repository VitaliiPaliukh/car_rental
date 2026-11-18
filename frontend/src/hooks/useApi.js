import { useEffect, useRef, useState } from 'react'

/**
 * Завантажує дані й повторно завантажує їх, коли змінюється `key`.
 * fetcher - функція, що повертає Promise; key - рядок, що описує параметри запиту.
 * Повертає { data, error, loading, reload }.
 */
export default function useApi(fetcher, key) {
    const [state, setState] = useState({ key: null, data: null, error: null })
    const [version, setVersion] = useState(0)
    const fetcherRef = useRef(fetcher)

    useEffect(() => {
        fetcherRef.current = fetcher
    })

    const fullKey = `${key}#${version}`

    useEffect(() => {
        let cancelled = false
        fetcherRef
            .current()
            .then((data) => {
                if (!cancelled) setState({ key: fullKey, data, error: null })
            })
            .catch((error) => {
                if (!cancelled) setState((prev) => ({ key: fullKey, data: prev.data, error }))
            })
        return () => {
            cancelled = true
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fullKey])

    return {
        data: state.data,
        error: state.error,
        loading: state.key !== fullKey,
        reload: () => setVersion((v) => v + 1),
    }
}