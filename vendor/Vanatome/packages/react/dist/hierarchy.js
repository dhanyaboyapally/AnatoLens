export function createVanatomeHierarchy(structures) {
    const nodes = new Map(structures.map((structure) => [
        structure.id,
        { ...structure, children: [] },
    ]));
    const roots = [];
    for (const node of nodes.values()) {
        const parent = node.parentId ? nodes.get(node.parentId) : undefined;
        if (parent)
            parent.children.push(node);
        else
            roots.push(node);
    }
    return roots;
}
export function getVanatomeDescendantIds(hierarchy, id) {
    const result = [];
    const visit = (nodes) => {
        for (const node of nodes) {
            if (node.id === id) {
                const collect = (current) => {
                    result.push(current.id);
                    current.children.forEach(collect);
                };
                collect(node);
                return true;
            }
            if (visit(node.children))
                return true;
        }
        return false;
    };
    visit(hierarchy);
    return result;
}
//# sourceMappingURL=hierarchy.js.map