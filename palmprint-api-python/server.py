from flask import Flask, request, jsonify
import cv2
import imutils
import numpy as np
import os
import uuid  # นำเข้า uuid

app = Flask(__name__)

# กำหนดที่เก็บภาพที่อัปโหลด
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'palmprint' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['palmprint']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    # สร้างชื่อไฟล์แบบสุ่ม
    random_filename = str(uuid.uuid4()) + '.png'  # ใช้ .png หรือประเภทไฟล์ที่เหมาะสม
    file_path = os.path.join(UPLOAD_FOLDER, random_filename)
    file.save(file_path)

    similarity = process_image(file_path)
    return jsonify({'result': similarity})

def process_image(image_path):
    # อ่านภาพ palmprint และภาพเฉลย
    image = cv2.imread(image_path)
    reference_image = cv2.imread('palmprint_origin.png', cv2.IMREAD_GRAYSCALE)

    # แปลงภาพเป็นขาวดำ
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # ใช้ imutils ในการปรับขนาดภาพ
    gray = imutils.resize(gray, width=600)

    # ใช้ GaussianBlur เพื่อลด noise ในภาพ
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # ใช้ Adaptive Thresholding
    adaptive_thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                                            cv2.THRESH_BINARY_INV, 15, 3)

    # ใช้การบีบอัดภาพ
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 4))
    dilated = cv2.dilate(adaptive_thresh, kernel, iterations=1)

    # ใช้ morphological transformations เพื่อเชื่อมเส้นในภาพ palmprint
    morph_kernel = np.ones((5, 5), np.uint8)
    closed_palmprint = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, morph_kernel)
    closed_palmprint = cv2.morphologyEx(closed_palmprint, cv2.MORPH_OPEN, morph_kernel)

    # ใช้ morphological transformations เพื่อเชื่อมเส้นในภาพเฉลย
    closed_reference = cv2.morphologyEx(reference_image, cv2.MORPH_CLOSE, morph_kernel)
    closed_reference = cv2.morphologyEx(closed_reference, cv2.MORPH_OPEN, morph_kernel)

    # ตรวจสอบขนาดของภาพเฉลยและ resize ให้เท่ากับภาพที่ประมวลผล
    if closed_palmprint.shape != closed_reference.shape:
        closed_reference = cv2.resize(closed_reference, (closed_palmprint.shape[1], closed_palmprint.shape[0]))

    # นับจำนวนพิกเซลที่เป็นสีขาวในภาพเฉลย
    white_pixels_reference = np.sum(closed_reference == 255)

    # สร้าง mask เพื่อเก็บเส้นในภาพเฉลย
    mask = closed_reference.copy()

    # คำนวณพื้นที่ที่มีเส้นใน palmprint ที่ตรงกับ mask
    masked_palmprint = cv2.bitwise_and(closed_palmprint, closed_palmprint, mask=mask)

    # นับจำนวนพิกเซลที่เป็นสีขาวใน masked palmprint
    white_pixels_masked_palmprint = np.sum(masked_palmprint == 255)

    # คำนวณเปอร์เซ็นต์เส้นใน palmprint ที่ตรงกับเส้นในภาพเฉลย
    similarity_percentage_lines = (white_pixels_masked_palmprint / white_pixels_reference) * 100 if white_pixels_reference > 0 else 0

    return round(similarity_percentage_lines, 2)

if __name__ == '__main__':
    app.run(debug=True)
