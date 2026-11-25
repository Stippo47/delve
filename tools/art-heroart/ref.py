import sys; sys.path.insert(0, '.')
from render import *
A = ROOT / "art"
H = 86.4
board("reference: casters", [(n, A/"heroes"/f"{n}.svg", H, False) for n in ["frost","waterMage","storm","pyromancer","druid","witch"]], HERE/"ref"/"casters.png")
board("reference: QM, beekeeper, bandit", [(n, A/"heroes"/f"{n}.svg", H, False) for n in ["quartermaster","beekeeper","bandit","shade","chef","engineer"]], HERE/"ref"/"others.png")
board("reference: bosses", [("queen", A/"bosses"/"winter-queen.svg", 131, False), ("chieftain", A/"bosses"/"goblin-chieftain.svg", 124.8, False), ("bone king", A/"bosses"/"bone-king.svg", 38*220/50, False)], HERE/"ref"/"bosses.png")
