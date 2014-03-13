deps = [[], [0,2], []]

def resolve_dependencies(index, resolved, seen):
    # no dependency => just append and continue to the next dep
    if not deps[index]:
        resolved.append(index)
        if index+1 < len(deps):
            resolve_dependencies(index+1, resolved, seen)
        return

    # walk the graph recursively;
    # for all dependencies check if it is already resolved;
    # keep track of seen to find circular dependency;
    seen.append(index)
    for dep in deps[index]:
        if dep not in resolved:
            if dep in seen:
                raise Exception('Circular dependency!')
            resolve_dependencies(dep, resolved, seen)

    resolved.append(index)
    seen.remove(index)  # you can remove from seen when dep is resolved

resolved = []
resolve_dependencies(0, resolved, [])
print resolved

