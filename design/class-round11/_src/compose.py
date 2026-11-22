"""Put several finished sprites into one SVG (for the boards only: a troll with its boulder, a design beside a hero at
the game's scale). Each sprite keeps its own outline filter; its ids are prefixed so they can't clash.
compose([(svg_text, transform), ...], comment) -> svg text in the usual 220 box."""
import re

ID = re.compile(r'\bid="([^"]+)"')


def prefixed(text, p):
    ids = set(ID.findall(text))
    def ref(m):
        return m.group(0).replace("#" + m.group(1), "#" + p + m.group(1)) if m.group(1) in ids else m.group(0)
    text = ID.sub(lambda m: f'id="{p}{m.group(1)}"', text)
    text = re.sub(r'url\(#([^)]+)\)', lambda m: f"url(#{p}{m.group(1)})" if m.group(1) in ids else m.group(0), text)
    text = re.sub(r'href="#([^"]+)"', lambda m: f'href="#{p}{m.group(1)}"' if m.group(1) in ids else m.group(0), text)
    return text


def inner(text):
    """The contents of the root <svg> (defs and the sprite group), without the root tag and the comment."""
    body = text[text.index(">", text.index("<svg")) + 1:text.rindex("</svg>")]
    return re.sub(r"<!--.*?-->", "", body, flags=re.S)


def compose(items, comment="", vb="-10 -10 220 220"):
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="220" height="220">']
    if comment:
        out.append(f"<!-- {comment} -->")
    for i, (text, tf) in enumerate(items):
        out.append(f'<g transform="{tf}">' + inner(prefixed(text, f"k{i}_")) + "</g>")
    out.append("</svg>\n")
    return "\n".join(out)
