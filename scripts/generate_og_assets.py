import os
from PIL import Image, ImageDraw, ImageFont

def generate_og_assets():
    public_dir = os.path.abspath("frontend/public")
    app_dir = os.path.abspath("frontend/src/app")
    os.makedirs(public_dir, exist_ok=True)
    os.makedirs(app_dir, exist_ok=True)

    # 1. 1200 x 630 Open Graph Banner
    width, height = 1200, 630
    img = Image.new("RGBA", (width, height), (11, 17, 32, 255)) # Dark navy
    draw = ImageDraw.Draw(img)

    # Draw subtle background gradient / grid or accents
    # Border
    draw.rectangle([10, 10, width - 11, height - 11], outline=(59, 130, 246, 180), width=3)
    draw.rectangle([14, 14, width - 15, height - 15], outline=(30, 58, 138, 100), width=2)

    # Top Pill Badge
    pill_box = [60, 50, 680, 95]
    draw.rounded_rectangle(pill_box, radius=20, fill=(30, 41, 59, 230), outline=(59, 130, 246, 200), width=1)
    
    # Text fonts (using default PIL font or simple truetype if available)
    try:
        font_pill = ImageFont.truetype("arial.ttf", 18)
        font_title = ImageFont.truetype("arialbd.ttf", 64)
        font_subtitle = ImageFont.truetype("arial.ttf", 26)
        font_tag = ImageFont.truetype("arialbd.ttf", 18)
        font_footer = ImageFont.truetype("arial.ttf", 20)
    except:
        font_pill = ImageFont.load_default()
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_tag = ImageFont.load_default()
        font_footer = ImageFont.load_default()

    draw.text((80, 62), "UNIVERSITY OF NAIROBI  |  CHIROMO CAMPUS", fill=(147, 197, 253), font=font_pill)

    # Main Title
    draw.text((60, 140), "EduRAG Scholar", fill=(255, 255, 255), font=font_title)
    # Accent color badge
    draw.text((60, 230), "Autonomous 7-Unit RAG Copilot & Academic Past Exam Vault", fill=(96, 165, 250), font=font_subtitle)
    draw.text((60, 275), "B.Sc. Computer Science Year 2 Revision Platform", fill=(148, 163, 184), font=font_subtitle)

    # Unit Tags
    units = [
        "SCS 3201: Systems Analysis",
        "SCS 3209: Software Eng",
        "SCS 3207: HCI",
        "SCS 3203: Network Prog",
        "SCS 3205: Distributed Sys",
        "SCS 3208: Mobile Dev",
        "SCS 3202: Adv Databases",
    ]

    tag_x = 60
    tag_y = 350
    for u in units:
        # compute text length roughly
        bbox = draw.textbbox((0, 0), u, font=font_tag)
        tw = bbox[2] - bbox[0] + 30
        if tag_x + tw > width - 60:
            tag_x = 60
            tag_y += 50
        draw.rounded_rectangle([tag_x, tag_y, tag_x + tw, tag_y + 36], radius=8, fill=(15, 23, 42, 240), outline=(59, 130, 246, 120), width=1)
        draw.text((tag_x + 15, tag_y + 8), u, fill=(226, 232, 240), font=font_tag)
        tag_x += tw + 14

    # Footer banner
    draw.line([(60, 540), (width - 60, 540)], fill=(51, 65, 85), width=1)
    draw.text((60, 560), "https://learningassistant-chi.vercel.app", fill=(59, 130, 246), font=font_footer)
    draw.text((width - 450, 560), "Grounded Citations  |  Direct PDF Launch", fill=(148, 163, 184), font=font_footer)

    og_path_public = os.path.join(public_dir, "og-image.png")
    og_path_app = os.path.join(app_dir, "opengraph-image.png")
    img.save(og_path_public, format="PNG")
    img.save(og_path_app, format="PNG")
    print(f"[OK] Saved {og_path_public}")
    print(f"[OK] Saved {og_path_app}")

    # 2. Favicon & Apple Touch Icon
    fav = Image.new("RGBA", (192, 192), (15, 23, 42, 255))
    fav_draw = ImageDraw.Draw(fav)
    fav_draw.rounded_rectangle([8, 8, 184, 184], radius=32, fill=(30, 58, 138, 255), outline=(96, 165, 250, 255), width=6)
    try:
        font_fav = ImageFont.truetype("arialbd.ttf", 90)
    except:
        font_fav = ImageFont.load_default()
    fav_draw.text((45, 45), "E", fill=(255, 255, 255), font=font_fav)

    fav.save(os.path.join(public_dir, "apple-touch-icon.png"), format="PNG")
    fav.save(os.path.join(app_dir, "apple-icon.png"), format="PNG")
    
    # Save 32x32 ico
    fav_32 = fav.resize((32, 32), Image.Resampling.LANCZOS)
    fav_32.save(os.path.join(public_dir, "favicon.ico"), format="ICO")
    fav_32.save(os.path.join(app_dir, "favicon.ico"), format="ICO")
    print("[OK] Saved Favicons & Apple Touch Icons")

if __name__ == "__main__":
    generate_og_assets()
