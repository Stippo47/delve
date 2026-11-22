"""Round 10, the art-round9 note on the Goblin Chieftain ("Are those feathers in hair? Fix teeth. Better weapons and dual
wielding. More and better war paint. 1 clipped ear"): bosses9e.chieftain9(r10=True), each change marked CHANGE10 there.
python bosses10e.py   -> ../../enemies/boss-goblin-chieftain.svg   (paths relative to this file)"""
from greenskins import *
import bosses9e as B9

if __name__ == "__main__":
    print(B9.chieftain9(r10=True).write("boss-goblin-chieftain.svg").relative_to(OUT.parent).as_posix())
