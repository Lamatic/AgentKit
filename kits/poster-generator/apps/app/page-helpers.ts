export type PosterDimensions = {
  width: number
  height: number
}

export const defaultPosterDimensions: PosterDimensions = { width: 794, height: 1123 }

export function slugifyName(name: string) {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

  return slug.length > 0 ? slug.slice(0, 64) : "poster"
}

export function getPosterRoot(doc: Document) {
  const explicitPosterRoot = doc.getElementById("poster")
  if (explicitPosterRoot) {
    return explicitPosterRoot
  }

  const getElementArea = (element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const width = Math.max(rect.width, element.scrollWidth, element.clientWidth)
    const height = Math.max(rect.height, element.scrollHeight, element.clientHeight)
    return width * height
  }

  const isRenderable = (element: HTMLElement) => {
    const style = doc.defaultView?.getComputedStyle(element)
    if (!style) {
      return true
    }

    if (style.display === "none" || style.visibility === "hidden") {
      return false
    }

    return getElementArea(element) > 0
  }

  const prioritizedSelectors = [
    "[data-poster-root]",
    "[id*='poster' i]",
    "[class*='poster' i]",
    "main",
    "article",
    "section",
  ]

  for (const selector of prioritizedSelectors) {
    const candidates = Array.from(doc.querySelectorAll<HTMLElement>(selector)).filter(isRenderable)
    if (candidates.length > 0) {
      candidates.sort((a, b) => getElementArea(b) - getElementArea(a))
      return candidates[0]
    }
  }

  const bodyChildren = Array.from(doc.body.children)
    .filter((child): child is HTMLElement => child instanceof HTMLElement)
    .filter(isRenderable)

  if (bodyChildren.length > 0) {
    bodyChildren.sort((a, b) => getElementArea(b) - getElementArea(a))
    return bodyChildren[0]
  }

  return doc.body
}

export function getPreviewRoot(doc: Document) {
  return doc.getElementById("poster") ?? getPosterRoot(doc)
}

export function getElementDimensions(element: HTMLElement): PosterDimensions {
  const rect = element.getBoundingClientRect()
  const width = Math.round(
    rect.width || element.scrollWidth || element.offsetWidth || element.clientWidth || defaultPosterDimensions.width
  )
  const height = Math.round(
    rect.height || element.scrollHeight || element.offsetHeight || element.clientHeight || defaultPosterDimensions.height
  )

  return {
    width: Math.max(width, 100),
    height: Math.max(height, 100),
  }
}
