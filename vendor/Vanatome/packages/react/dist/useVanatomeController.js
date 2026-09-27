import { useCallback, useMemo, useState } from "react";
export function useVanatomeController(initialLayers = []) {
    const [selectedId, setSelectedId] = useState(null);
    const [isolation, setIsolation] = useState(null);
    const isolatedId = isolation?.id ?? null;
    const [visibleLayers, setVisibleLayersState] = useState(initialLayers);
    const [focusRequestKey, setFocusRequestKey] = useState(0);
    const [resetViewKey, setResetViewKey] = useState(0);
    const select = useCallback((id) => {
        setSelectedId(id);
        if (id)
            setFocusRequestKey((key) => key + 1);
    }, []);
    const focus = useCallback((id) => {
        if (id !== undefined)
            setSelectedId(id);
        setFocusRequestKey((key) => key + 1);
    }, []);
    const isolate = useCallback((id, mode = "selected") => {
        const targetId = id === undefined ? selectedId : id;
        setIsolation(targetId ? { id: targetId, mode } : null);
    }, [selectedId]);
    const clear = useCallback(() => {
        setSelectedId(null);
        setIsolation(null);
    }, []);
    const reset = useCallback(() => {
        setSelectedId(null);
        setIsolation(null);
        setVisibleLayersState(initialLayers);
        setResetViewKey((key) => key + 1);
    }, [initialLayers]);
    const setVisibleLayers = useCallback((layers) => {
        setVisibleLayersState([...layers]);
    }, []);
    const toggleLayer = useCallback((layer) => {
        setVisibleLayersState((layers) => layers.includes(layer)
            ? layers.filter((candidate) => candidate !== layer)
            : [...layers, layer]);
    }, []);
    return useMemo(() => ({
        selectedId,
        isolatedId,
        isolation,
        visibleLayers,
        focusRequestKey,
        resetViewKey,
        select,
        focus,
        isolate,
        clear,
        reset,
        setVisibleLayers,
        toggleLayer,
    }), [
        focus,
        focusRequestKey,
        clear,
        isolate,
        isolatedId,
        isolation,
        reset,
        resetViewKey,
        select,
        selectedId,
        setVisibleLayers,
        toggleLayer,
        visibleLayers,
    ]);
}
//# sourceMappingURL=useVanatomeController.js.map