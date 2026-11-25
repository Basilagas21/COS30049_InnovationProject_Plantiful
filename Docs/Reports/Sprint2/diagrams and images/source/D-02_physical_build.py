"""Build matching SVG and diagrams.net physical wiring review drafts.

Run from any directory with Python 3. No third-party packages are required.
Coordinates and colours are intentionally stable between revisions.
"""

from pathlib import Path
from html import escape
import json
import xml.etree.ElementTree as ET

OUT = Path(__file__).resolve().parent.parent / 'exported'
SOURCE = Path(__file__).resolve().parent
W, H = 2600, 1990
C = dict(bg='#f4f7fb', ink='#162b40', muted='#52677b', border='#cbd5e1',
         power='#d94645', ground='#334155', dht='#008b8b', pir='#7c3aed',
         led='#b77900', soil='#16803c', rain='#2563eb')
svg = []
mx = ET.Element('mxfile', host='app.diagrams.net', version='24.7.17')
diagram = ET.SubElement(mx, 'diagram', id='D02-physical', name='D-02 physical build')
model = ET.SubElement(diagram, 'mxGraphModel', dx=str(W), dy=str(H), grid='1',
                      gridSize='10', page='1', pageScale='1', pageWidth=str(W),
                      pageHeight=str(H), background=C['bg'], math='0', shadow='0')
root = ET.SubElement(model, 'root')
ET.SubElement(root, 'mxCell', id='0')
ET.SubElement(root, 'mxCell', id='1', parent='0')
counter = 1


def cell(style, value='', x=0, y=0, w=0, h=0):
    global counter
    counter += 1
    node = ET.SubElement(root, 'mxCell', id=str(counter), value=value, style=style,
                         vertex='1', parent='1')
    ET.SubElement(node, 'mxGeometry', x=str(x), y=str(y), width=str(w),
                  height=str(h), **{'as': 'geometry'})


def rect(x, y, w, h, fill='white', stroke=None, radius=12):
    stroke = stroke or C['border']
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>')
    cell(f'rounded={int(radius > 0)};arcSize=10;fillColor={fill};strokeColor={stroke};strokeWidth=2;', x=x, y=y, w=w, h=h)


def text(x, y, value, size=20, color=None, bold=False, align='left'):
    color = color or C['ink']
    anchor = dict(left='start', center='middle', right='end')[align]
    svg.append(f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" font-weight="{700 if bold else 400}" text-anchor="{anchor}">{escape(value)}</text>')
    width = max(30, len(value) * size * .68)
    left = x if align == 'left' else x - (width / 2 if align == 'center' else width)
    cell(f'text;html=0;strokeColor=none;fillColor=none;whiteSpace=wrap;align={align};verticalAlign=middle;fontFamily=Arial;fontSize={size};fontColor={color};fontStyle={int(bold)};spacing=0;',
         value=value, x=left, y=y-size, w=width, h=size*1.3)


def dot(x, y, r=5, fill=None, stroke='white'):
    fill = fill or C['ink']
    svg.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="1.5"/>')
    cell(f'ellipse;fillColor={fill};strokeColor={stroke};strokeWidth=1.5;', x=x-r, y=y-r, w=2*r, h=2*r)


def line(points, color, width=3, dashed=False):
    value = ' '.join(f'{x},{y}' for x, y in points)
    dash = ' stroke-dasharray="7 5"' if dashed else ''
    svg.append(f'<polyline points="{value}" fill="none" stroke="{color}" stroke-width="{width}" stroke-linejoin="round" stroke-linecap="round"{dash}/>')
    global counter
    counter += 1
    node = ET.SubElement(root, 'mxCell', id=str(counter), value='', parent='1', edge='1',
                         style=f'edgeStyle=none;rounded=0;html=0;endArrow=none;startArrow=none;strokeColor={color};strokeWidth={width};dashed={int(dashed)};')
    geo = ET.SubElement(node, 'mxGeometry', relative='1', **{'as': 'geometry'})
    for key, (x, y) in [('sourcePoint', points[0]), ('targetPoint', points[-1])]:
        ET.SubElement(geo, 'mxPoint', x=str(x), y=str(y), **{'as': key})
    if len(points) > 2:
        array = ET.SubElement(geo, 'Array', **{'as': 'points'})
        for x, y in points[1:-1]:
            ET.SubElement(array, 'mxPoint', x=str(x), y=str(y))


def badge(x, y, value, color, size=17):
    width = len(value)*size*.59 + 24
    rect(x, y-22, width, 30, 'white', 'white', 5)
    text(x+10, y, value, size, color, True)


def hole(board, coordinate):
    row, letter = int(coordinate[:-1]), coordinate[-1]
    column = 'abcdefghij'.index(letter)
    return (650 if board == 1 else 1630) + 150 + 28*column + (40 if column >= 5 else 0), 550+28*(row-1)


def rail(board, kind, y):
    return (650 if board == 1 else 1630)+(50 if kind == '+' else 80), y


ports = {}
for pin, y in [('D04', 570), ('D27', 710), ('D26', 850), ('D34', 990), ('D35', 1130)]:
    for offset, role in enumerate(['S', 'V', 'G']):
        ports[f'{pin}.{role}'] = (390, y+24*offset)

# Draw the base and explanatory labels before the overlay of jumper wires.
rect(0, 0, W, H, C['bg'], C['bg'], 0)
text(60, 66, 'PLANTIFUL / PHYSICAL IoT BUILD', 38, bold=True)
text(60, 101, 'D-02  |  Review draft v1  |  Rain AO confirmed as D35  |  28 October 2026', 21, C['muted'])
legend_x = 60
for key, label in [('power', 'V supply'), ('ground', 'GND'), ('dht', 'DHT11'), ('pir', 'PIR'), ('led', 'LED'), ('soil', 'Soil AO'), ('rain', 'Rain AO')]:
    line([(legend_x, 140), (legend_x+32, 140)], C[key], 5)
    text(legend_x+43, 147, label, 20)
    legend_x += 185
text(1450, 147, 'Dots mark endpoints. Crossing wires do not join.', 20, C['muted'])

# Generic shield rendering. Pin spacing is diagrammatic, not a claimed shield model.
rect(60, 185, 360, 1080, '#e8eff5', '#9fb1c3', 20)
text(240, 224, 'ESP32 + SENSOR SHIELD', 22, bold=True, align='center')
rect(118, 250, 244, 180, '#30495e', '#30495e')
rect(150, 270, 180, 90, '#dce4eb', '#9fb1c3', 3)
text(240, 308, 'ESP32', 29, bold=True, align='center')
text(240, 341, 'USB / serial', 19, align='center')
rect(202, 390, 76, 30, '#cbd5e1', '#9fb1c3', 3)
text(85, 463, 'Header positions are schematic.', 17, C['muted'])
text(85, 489, 'Use the printed S / V / G labels.', 17, C['muted'])
for pin, y in [('D04', 570), ('D27', 710), ('D26', 850), ('D34', 990), ('D35', 1130)]:
    rect(85, y-37, 315, 103, '#f8fafc', '#cbd5e1', 8)
    text(105, y+2, pin, 27, bold=True)
    text(105, y+30, 'GPIO '+str(int(pin[1:])), 17, C['muted'])
    for role in ['S', 'V', 'G']:
        px, py = ports[f'{pin}.{role}']
        text(350, py+6, role, 18, bold=True)
        unused = pin in ['D34', 'D35'] and role in ['V', 'G'] or pin == 'D26' and role == 'V'
        dot(px, py, 6, 'white' if unused else C['ink'], C['muted'])
        if unused:
            text(303, py+5, 'empty', 13, C['muted'], align='right')
text(85, 1236, 'D33 is not used in this build.', 18, C['rain'], True)

def breadboard(board):
    bx = 650 if board == 1 else 1630
    rect(bx, 470, 560, 972, '#ffffff', '#afbecd', 18)
    text(bx+280, 503, f'BREADBOARD {board}', 23, bold=True, align='center')
    rect(bx+278, 530, 34, 870, '#eef2f6', '#eef2f6', 0)
    # Grey bars expose the two independent five-hole row groups.
    for row in range(1, 31):
        y = hole(board, f'{row}a')[1]
        line([hole(board, f'{row}a'), hole(board, f'{row}e')], '#e5ebf1', 9)
        line([hole(board, f'{row}f'), hole(board, f'{row}j')], '#e5ebf1', 9)
        text(bx+128, y+5, str(row), 14, C['muted'], align='right')
        text(bx+466, y+5, str(row), 14, C['muted'])
        for col in 'abcdefghij':
            dot(*hole(board, f'{row}{col}'), 3.4, '#bcc8d3', '#aab8c5')
    for col in 'abcdefghij':
        text(hole(board, '1'+col)[0], 530, col, 16, C['muted'], True, 'center')
    for kind, key in [('+', 'power'), ('-', 'ground')]:
        x, _ = rail(board, kind, 0)
        line([(x, 535), (x, 1395)], C[key], 3)
        text(x, 529, kind, 22, C[key], True, 'center')
        for row in range(1, 31):
            dot(x, hole(board, f'{row}a')[1], 3, '#ffffff', C[key])
    text(bx+280, 1425, 'a-e linked per row   |   f-j linked per row', 17, C['muted'], align='center')

breadboard(1)
breadboard(2)

# Sensors above board 1. Their mechanical placement is illustrative.
rect(775, 190, 150, 122, '#b9e4ed', '#008b8b')
for x in range(790, 916, 18):
    line([(x, 203), (x, 243)], '#55abbc', 5)
text(850, 278, 'DHT11', 24, C['dht'], True, 'center')
text(850, 300, '3-pin module', 15, C['muted'], align='center')
dht = {'+': (800, 335), 'OUT': (850, 335), '-': (900, 335)}
for name, (x, y) in dht.items():
    line([(x, 312), (x, y)], '#64748b', 4)
    text(x, 329, name, 13, C['ink'], True, 'center')
rect(1070, 190, 180, 122, '#d8efe0', '#16803c')
dot(1160, 237, 35, '#f8fafc', '#afbecd')
text(1160, 291, 'PIR MODULE', 20, bold=True, align='center')
pir = {'VCC': (1090, 335), 'OUT': (1160, 335), 'GND': (1230, 335)}
for name, (x, y) in pir.items():
    line([(x, 312), (x, y)], '#64748b', 4)
    text(x, 329, name, 13, C['ink'], True, 'center')

rect(1630, 190, 560, 225, '#eaf2ff', '#b9cfee')
text(1655, 225, 'BOARD 2 MODULE PIN MAP', 23, C['rain'], True)
for y, value in [(262, 'Soil   21f VCC / 22f GND / 23f DO / 24f AO'),
                 (296, 'Rain  27f VCC / 28f GND / 29f DO / 30f AO'),
                 (336, 'Jumpers use g in the same connected row.'),
                 (371, 'DO pins are inserted but have no jumper.')]:
    text(1655, y, value, 19)

# Explicit coordinate definitions for every jumper. Changing a route does not
# change its endpoints. Rail tap rows are illustrative where none were supplied.
wires = []
def wire(name, a, b, start, end, key, bends=()):
    wires.append(dict(id=name, start=a, end=b, color=key, points=[start, *bends, end]))

wire('W01', 'D04.S', 'B1.4a', ports['D04.S'], hole(1, '4a'), 'dht', [(520, 570), (520, 634)])
wire('W02', 'D04.V', 'B1.+', ports['D04.V'], rail(1, '+', 550), 'power', [(490, 594), (490, 550)])
wire('W03', 'D04.G', 'B1.-', ports['D04.G'], rail(1, '-', 578), 'ground', [(465, 618), (465, 578)])
wire('W04', 'D27.S', 'B1.27b', ports['D27.S'], hole(1, '27b'), 'pir', [(540, 710), (540, 1278)])
wire('W05', 'D27.V', 'B1.+', ports['D27.V'], rail(1, '+', 690), 'power', [(500, 734), (500, 690)])
wire('W06', 'D27.G', 'B1.-', ports['D27.G'], rail(1, '-', 718), 'ground', [(480, 758), (480, 718)])
wire('W07', 'D26.S', 'B1.26a', ports['D26.S'], hole(1, '26a'), 'led', [(560, 850), (560, 1250)])
wire('W08', 'D26.G', 'B1.25j', ports['D26.G'], hole(1, '25j'), 'ground', [(445, 898), (445, 1510), (1380, 1510), (1380, 1222)])
wire('W09', 'D34.S', 'B2.24g', ports['D34.S'], hole(2, '24g'), 'soil', [(430, 990), (430, 1570), (2350, 1570), (2350, 1194)])
wire('W10', 'D35.S', 'B2.30g', ports['D35.S'], hole(2, '30g'), 'rain', [(460, 1130), (460, 1610), (2390, 1610), (2390, 1362)])
wire('W11', 'DHT.+', 'B1.+', dht['+'], rail(1, '+', 606), 'power', [(800, 370), (700, 370)])
wire('W12', 'DHT.OUT', 'B1.4b', dht['OUT'], hole(1, '4b'), 'dht', [(850, 420), (828, 420)])
wire('W13', 'DHT.-', 'B1.-', dht['-'], rail(1, '-', 662), 'ground', [(900, 440), (730, 440)])
wire('W14', 'PIR.VCC', 'B1.+', pir['VCC'], rail(1, '+', 746), 'power', [(1090, 390), (675, 390), (675, 746)])
wire('W15', 'PIR.OUT', 'B1.27a', pir['OUT'], hole(1, '27a'), 'pir', [(1160, 350), (1320, 350), (1320, 1310), (800, 1310)])
wire('W16', 'PIR.GND', 'B1.-', pir['GND'], rail(1, '-', 802), 'ground', [(1230, 410), (750, 410), (750, 802)])
wire('W17', 'B1.+', 'B2.+', rail(1, '+', 1395), rail(2, '+', 1395), 'power', [(700, 1650), (1680, 1650)])
wire('W18', 'B1.-', 'B2.-', rail(1, '-', 1395), rail(2, '-', 1395), 'ground', [(730, 1690), (1710, 1690)])
wire('W19', 'B2.21g', 'B2.+', hole(2, '21g'), rail(2, '+', 1054), 'power', [(1988, 1070), (1680, 1070)])
wire('W20', 'B2.22g', 'B2.-', hole(2, '22g'), rail(2, '-', 1026), 'ground', [(2010, 1138), (2010, 1040), (1710, 1040)])
wire('W21', 'B2.27g', 'B2.+', hole(2, '27g'), rail(2, '+', 1222), 'power', [(1988, 1236), (1680, 1236)])
wire('W22', 'B2.28g', 'B2.-', hole(2, '28g'), rail(2, '-', 1250), 'ground', [(2020, 1306), (2020, 1208), (1710, 1208)])

for w in wires:
    # White underlay makes insulated crossings readable in both exports.
    line(w['points'], 'white', 9)
    line(w['points'], C[w['color']], 4)
for w in wires:
    # Draw endpoints last so later crossing wires cannot hide a connection dot.
    dot(*w['points'][0], 5, C[w['color']])
    dot(*w['points'][-1], 5, C[w['color']])

# Put physical component leads above jumper overlays, preserving their endpoints.
for label, first, key in [('SOIL', 21, 'soil'), ('RAIN', 27, 'rain')]:
    top = hole(2, f'{first}f')[1]-22
    rect(1840, top, 94, 128, '#edf7ef' if key == 'soil' else '#edf3ff', C[key], 5)
    for offset, name in enumerate(['VCC', 'GND', 'DO', 'AO']):
        coord = f'{first+offset}f'
        hx, hy = hole(2, coord)
        text(1851, hy+5, name, 16, C[key], True)
        line([(1934, hy), (hx, hy)], '#64748b', 3)
        dot(hx, hy, 5, C[key])
    text(1833, top-10, label+' MODULE', 18, C[key], True)
    dx, dy = hole(2, f'{first+2}j')
    text(dx+60, dy+5, 'DO unused', 15, C['muted'])

# Resistor directly between 26b and 25b, then LED across 25e and 25f.
rx, ry = hole(1, '25b')
line([(rx, ry), (rx, ry+4), (rx-6, ry+8), (rx+6, ry+12), (rx-6, ry+16), (rx+6, ry+20), (rx, ry+24), (rx, ry+28)], C['led'], 3)
dot(rx, ry, 5, C['led'])
dot(rx, ry+28, 5, C['led'])
ax, ay = hole(1, '25e')
kx, ky = hole(1, '25f')
line([(ax, ay), (kx, ky)], C['led'], 3)
dot((ax+kx)/2, ay, 15, '#fbbf24', C['led'])
dot(ax, ay, 5, C['led'])
dot(kx, ky, 5, C['ground'])
text(ax, ay-22, 'A +', 15, C['led'], True, 'center')
text(kx, ky-22, 'K -', 15, C['ground'], True, 'center')

# Coordinate callouts, away from the densest routing.
badge(880, 674, '4a / 4b  DHT data', C['dht'])
badge(905, 1353, '27a / 27b  PIR OUT', C['pir'])
badge(875, 1152, 'LED + resistor: see inset', C['led'], 16)
badge(1030, 1497, '25j return to D26 G', C['ground'])
badge(1100, 1556, 'W09  D34 S to board 2 / 24g', C['soil'])
badge(1100, 1596, 'W10  D35 S to board 2 / 30g', C['rain'])
badge(1050, 1636, 'Board 1 + rail to board 2 + rail', C['power'])
badge(1050, 1676, 'Board 1 - rail to board 2 - rail', C['ground'])

rect(2240, 190, 300, 530, '#ffffff', '#cbd5e1')
text(2263, 225, 'READ THIS DRAWING', 21, bold=True)
for y, value in [(266, 'Filled dots = wire endpoints'), (301, 'Grey row bars = internal links'),
                 (336, 'No link across centre gap'), (371, 'Rail tap rows are illustrative'),
                 (406, 'Exact signal holes are labelled'), (441, 'D34 and D35 use S only'),
                 (476, 'Their V and G stay empty'), (511, 'D26 V is also unused'),
                 (562, 'Rail voltage not yet confirmed'), (597, 'Resistor value not yet confirmed'),
                 (647, 'Generic component outlines'), (682, 'Not an assembly photograph')]:
    text(2263, y, value, 16, C['muted'])

rect(60, 1740, 1300, 195, '#fff9eb', '#e8cf93')
text(85, 1776, 'LED PATH / ENLARGED CONNECTIVITY', 24, C['led'], True)
text(85, 1818, 'D26 S → 26a = 26b → resistor → 25b = 25e → LED anode (long leg)', 23)
text(85, 1858, 'LED cathode (short leg) → 25f = 25j → D26 G', 23)
text(85, 1898, '= means an internal breadboard row link. The LED spans the centre gap.', 20, C['muted'])
rect(1400, 1740, 1140, 195, '#eaf2ff', '#b9cfee')
text(1425, 1776, 'REVIEW BASIS', 24, C['rain'], True)
text(1425, 1818, 'User-supplied hole map, with D35 confirmed on 28 October 2026.', 22)
text(1425, 1858, 'Confirm shield supply, split-rail continuity and resistor value.', 22)
text(1425, 1898, 'Draft for user review. Editable vector source preserves this theme.', 20, C['muted'])
text(60, 1970, 'PLANTIFUL  /  D-02  /  v1  /  GPIO map matches repository firmware  /  Component dimensions and wire routes are illustrative', 19, C['muted'])


def validate():
    """Check actual generated wire endpoints and passive breadboard topology."""
    assert len(wires) == 22
    assert len({w['id'] for w in wires}) == 22
    # An independent endpoint contract copied from the supplied map.
    expected = {
        ('D04.S', 'B1.4a'), ('D04.V', 'B1.+'), ('D04.G', 'B1.-'),
        ('D27.S', 'B1.27b'), ('D27.V', 'B1.+'), ('D27.G', 'B1.-'),
        ('D26.S', 'B1.26a'), ('D26.G', 'B1.25j'),
        ('D34.S', 'B2.24g'), ('D35.S', 'B2.30g'),
        ('DHT.+', 'B1.+'), ('DHT.OUT', 'B1.4b'), ('DHT.-', 'B1.-'),
        ('PIR.VCC', 'B1.+'), ('PIR.OUT', 'B1.27a'), ('PIR.GND', 'B1.-'),
        ('B1.+', 'B2.+'), ('B1.-', 'B2.-'),
        ('B2.21g', 'B2.+'), ('B2.22g', 'B2.-'),
        ('B2.27g', 'B2.+'), ('B2.28g', 'B2.-'),
    }
    assert {(w['start'], w['end']) for w in wires} == expected
    parent = {}
    def find(a):
        parent.setdefault(a, a)
        if parent[a] != a:
            parent[a] = find(parent[a])
        return parent[a]
    def join(a, b):
        parent[find(a)] = find(b)
    for board in [1, 2]:
        for row in range(1, 31):
            for group in ['abcde', 'fghij']:
                for col in group[1:]:
                    join(f'B{board}.{row}{group[0]}', f'B{board}.{row}{col}')
    for w in wires:
        join(w['start'], w['end'])
        for endpoint, xy in [(w['start'], w['points'][0]), (w['end'], w['points'][-1])]:
            if endpoint.startswith('B') and endpoint[-1] in 'abcdefghij':
                board, coord = endpoint.split('.')
                assert tuple(xy) == hole(int(board[1]), coord), (endpoint, xy)
        assert all(0 <= x <= W and 0 <= y <= H for x, y in w['points'])
    # Ground and V header pins share their respective shield nets.
    for pin in ['D27', 'D26']:
        join('D04.G', pin+'.G')
    join('D04.V', 'D27.V')
    assert find('D04.S') == find('DHT.OUT')
    assert find('D27.S') == find('PIR.OUT')
    assert find('D34.S') == find('B2.24f')
    assert find('D35.S') == find('B2.30f')
    assert find('B1.+') != find('B1.-')
    assert find('B1.26b') == find('D26.S')
    assert find('B1.25b') == find('B1.25e')
    assert find('B1.25f') == find('D26.G')
    assert len({find('B1.26b'), find('B1.25b'), find('B1.25f')}) == 3
    for coord in ['23f', '29f']:
        assert find('B2.'+coord) not in {find('B2.+'), find('B2.-'), find('D34.S'), find('D35.S')}
    print('PASS: 22 jumper endpoints, signal nets, rail separation, LED series nodes and unused DO rows')


if __name__ == '__main__':
    validate()
    OUT.mkdir(parents=True, exist_ok=True)
    document = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}" role="img" aria-labelledby="title desc"><title id="title">Plantiful physical IoT wiring draft</title><desc id="desc">ESP32 shield and two breadboards, DHT11, PIR, LED with series resistor, soil and rain analogue modules. Rain uses GPIO35. Supply voltage and resistor value await confirmation.</desc><g font-family="Arial, sans-serif">'+''.join(svg)+'</g></svg>'
    (OUT / 'D-02_physical_build.svg').write_text(document, encoding='utf-8')
    ET.indent(mx)
    ET.ElementTree(mx).write(SOURCE / 'D-02_physical_build.drawio', encoding='utf-8', xml_declaration=True)
    components = {
        'resistor': {'leg1': 'B1.26b', 'leg2': 'B1.25b', 'ohms': None},
        'LED': {'anode_long': 'B1.25e', 'cathode_short': 'B1.25f'},
        'soil_module': {'VCC': 'B2.21f', 'GND': 'B2.22f', 'DO_unused': 'B2.23f', 'AO': 'B2.24f'},
        'rain_module': {'VCC': 'B2.27f', 'GND': 'B2.28f', 'DO_unused': 'B2.29f', 'AO': 'B2.30f'},
    }
    (SOURCE / 'D-02_connections.json').write_text(json.dumps(dict(revision='v1-review', rain_pin='D35', supply_volts=None, components=components, wires=wires), indent=2)+'\n', encoding='utf-8')
    print('Generated SVG, editable diagrams.net XML and connection manifest')
