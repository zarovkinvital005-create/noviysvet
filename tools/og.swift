// Генератор превью-картинок 1200×630 для ссылок. Запуск: swift tools/og.swift tools/og-jobs.json assets/logo-white.png
import AppKit
let W: CGFloat = 1200, H: CGFloat = 630
let jobs = try! JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))) as! [[String: Any]]
let logo = NSImage(contentsOfFile: CommandLine.arguments[2])!
let cobalt = NSColor(red: 0, green: 64/255, blue: 193/255, alpha: 1)

func attr(_ s: String, _ size: CGFloat, _ w: NSFont.Weight, _ c: NSColor) -> NSAttributedString {
  let p = NSMutableParagraphStyle(); p.lineSpacing = size * 0.04; p.lineBreakMode = .byWordWrapping
  return NSAttributedString(string: s, attributes: [.font: NSFont.systemFont(ofSize: size, weight: w), .foregroundColor: c, .paragraphStyle: p])
}
// рисует текст в блоке: верх блока = topY (сверху вниз), возвращает высоту
@discardableResult func block(_ s: NSAttributedString, x: CGFloat, topY: CGFloat, width: CGFloat) -> CGFloat {
  let b = s.boundingRect(with: NSSize(width: width, height: 2000), options: [.usesLineFragmentOrigin])
  s.draw(with: NSRect(x: x, y: H - topY - ceil(b.height), width: width, height: ceil(b.height)), options: [.usesLineFragmentOrigin])
  return ceil(b.height)
}
func fitSize(_ s: String, _ w: NSFont.Weight, width: CGFloat, maxLines: Int, from: CGFloat, to: CGFloat) -> CGFloat {
  var size = from
  while size > to { let b = attr(s, size, w, .white).boundingRect(with: NSSize(width: width, height: 2000), options: [.usesLineFragmentOrigin]); if b.height <= size * 1.12 * CGFloat(maxLines) { break }; size -= 2 }
  return size
}
func photoCard(_ path: String, _ rect: NSRect, pad: CGFloat) {
  NSColor.white.setFill(); NSBezierPath(roundedRect: rect, xRadius: 28, yRadius: 28).fill()
  guard let im = NSImage(contentsOfFile: path) else { return }
  let r = rect.insetBy(dx: pad, dy: pad)
  let k = min(r.width / im.size.width, r.height / im.size.height)
  let w = im.size.width * k, h = im.size.height * k
  NSGraphicsContext.current?.saveGraphicsState()
  NSBezierPath(roundedRect: rect, xRadius: 28, yRadius: 28).addClip()
  im.draw(in: NSRect(x: r.midX - w/2, y: r.midY - h/2, width: w, height: h), from: .zero, operation: .multiply, fraction: 1)
  NSGraphicsContext.current?.restoreGraphicsState()
}
for j in jobs {
  let out = j["out"] as! String
  let img = NSImage(size: NSSize(width: W, height: H)); img.lockFocus()
  NSGradient(colors: [NSColor(red: 10/255, green: 13/255, blue: 18/255, alpha: 1), NSColor(red: 0, green: 51/255, blue: 160/255, alpha: 1), NSColor(red: 47/255, green: 107/255, blue: 224/255, alpha: 1)], atLocations: [0, 0.6, 1], colorSpace: .sRGB)!.draw(in: NSRect(x: 0, y: 0, width: W, height: H), angle: -35)
  NSColor(white: 1, alpha: 0.12).setStroke()
  for r in [330.0, 230.0] { let c = NSBezierPath(ovalIn: NSRect(x: 1010 - r, y: H - 200 - r, width: 2*r, height: 2*r)); c.lineWidth = 2; c.stroke() }
  // знак + название
  cobalt.setFill(); NSBezierPath(roundedRect: NSRect(x: 72, y: H - 148, width: 76, height: 76), xRadius: 20, yRadius: 20).fill()
  let lw: CGFloat = 60, lh = lw * logo.size.height / logo.size.width
  logo.draw(in: NSRect(x: 72 + (76-lw)/2, y: H - 148 + (76-lh)/2 - 1, width: lw, height: lh))
  block(attr("Новый Свет", 34, .bold, .white), x: 168, topY: 92, width: 360)
  let title = j["title"] as! String, sub = (j["sub"] as? String) ?? "", label = (j["label"] as? String) ?? ""
  let textW: CGFloat = 520
  if !label.isEmpty { block(attr(label.uppercased(), 20, .semibold, NSColor(red: 157/255, green: 184/255, blue: 1, alpha: 1)), x: 72, topY: 215, width: textW) }
  let ts = fitSize(title, .heavy, width: textW, maxLines: 3, from: 78, to: 40)
  let th = block(attr(title, ts, .heavy, .white), x: 72, topY: 250, width: textW)
  if !sub.isEmpty { block(attr(sub, 26, .regular, NSColor(red: 201/255, green: 214/255, blue: 1, alpha: 1)), x: 72, topY: 250 + th + 22, width: textW) }
  block(attr(j["foot"] as? String ?? "Подбор и поставка под заказ", 22, .medium, NSColor(white: 1, alpha: 0.7)), x: 72, topY: 560, width: 560)
  // правая часть: фото
  let photos = j["photos"] as! [String]
  if photos.count == 1 {
    photoCard(photos[0], NSRect(x: 640, y: 80, width: 490, height: 470), pad: 30)
  } else {
    let cw: CGFloat = 238, ch: CGFloat = 228, gx: CGFloat = 14
    for (i, p) in photos.prefix(4).enumerated() {
      let col = CGFloat(i % 2), row = CGFloat(i / 2)
      photoCard(p, NSRect(x: 640 + col * (cw + gx), y: 80 + (1 - row) * (ch + gx + 2), width: cw, height: ch), pad: 18)
    }
  }
  img.unlockFocus()
  let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
  try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.86])!.write(to: URL(fileURLWithPath: out))
}
