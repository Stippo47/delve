"""The croc (round 8): the picked Croc A, built exactly as round 7 built it (lizards7.py: no eyes, no face shading,
the teeth tucked in), with CROC_R8 on: two axes. croc(False) gives the round-7 file byte for byte (check8.py checks).
python croc8.py   -> ../enemies/sewer-croc.svg   (paths relative to this file)"""
import sys, pathlib

HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE.parent / "enemies"


def croc(r8=True, r10=False):
    sys.path.insert(0, str(HERE / "E1r4"))
    try:
        import lib as l1
        import lizards as lz
        lz.EYES, lz.FACE = False, False
        lz.TEETH_IN, lz.BLADE_R7 = True, False
        lz.CROC_R8 = r8
        lz.CROC_R10 = r10
        S = lz.liz_c()
        S.comment = S.comment.replace("(round 4", "(round 6, version a: the round-4 design without eyes; was round 4", 1)
        if r8:
            S.comment = S.comment.replace('LIZARDMAN C "croc" (round 6', 'CROC (round 8: the picked Croc A with two axes; '
                                          'LIZARDMAN C "croc" round 6', 1)
        return S.svg()
    finally:
        sys.path.remove(str(HERE / "E1r4"))
        for m in ("lib", "lizards"):
            sys.modules.pop(m, None)


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "sewer-croc.svg").write_text(croc(r10=True), encoding="utf-8")
    print("enemies/sewer-croc.svg")
