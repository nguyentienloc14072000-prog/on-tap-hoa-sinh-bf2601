# Ôn tập Hóa sinh y sinh · BF2601

Trang ôn tập tiếng Việt dành cho cá nhân và bạn bè, chỉ dựa trên 9 PDF trong bộ **Slide 2024** (497 trang). Không bổ sung kiến thức từ Internet, bài thí nghiệm hoặc tiểu luận.

**218 câu trắc nghiệm**, chia theo từng file, có giải thích và đường dẫn đến trang PDF nguồn. Các ghi chú là bản tóm tắt để ôn tập; PDF gốc là tài liệu đối chiếu.

## Sử dụng

- Đọc ghi chú và mở PDF theo từng phần.
- Luyện tập với phản hồi sau mỗi câu, hoặc tự kiểm tra để xem đáp án khi nộp bài.
- Trộn thứ tự câu hỏi và đáp án; chọn 10, 20, 30 câu hoặc toàn bộ phạm vi.
- Xem kết quả, ôn lại câu sai và tiếp tục lượt làm bài đã lưu.

Không cần tài khoản. Tiến độ được lưu trong trình duyệt trên từng thiết bị; không đồng bộ giữa bạn bè hoặc thiết bị. Trang không gửi kết quả lên máy chủ.

## Cấu trúc

- `dist/`: website có thể xuất bản trực tiếp, bao gồm PDF nguồn trong `dist/sources/`.
- `content/s01.json` … `s09.json`: ghi chú và ngân hàng câu hỏi theo từng PDF.
- `noi-dung-theo-file/`: bản Markdown dễ đọc, một file tương ứng với một PDF.
- `scripts/build.py`: kiểm tra dữ liệu và tạo lại nội dung xuất bản.

Chỉ số trang trong câu hỏi là **số trang PDF**, tính từ trang đầu tiên, không phải số in trên slide. Gluxit chỉ bao gồm phần thực sự có trong PDF. Phần phân tích lipid ở cuối PDF Nước – khoáng được giữ trong file tương ứng.

## Chạy tại máy

```sh
python -m http.server 8765 --directory dist
```

Sau đó mở http://localhost:8765. Không cần cài thư viện JavaScript hoặc dịch vụ backend.

## Cập nhật nội dung và xuất bản

Chỉnh sửa JSON trong `content/`, sau đó chạy Python có thư viện `pypdf`:

```sh
python scripts/build.py
node --check dist/app.js
git add content dist noi-dung-theo-file
git commit -m "Cap nhat noi dung on tap"
git push origin main
git subtree push --prefix dist origin gh-pages
```

GitHub Pages xuất bản nhánh `gh-pages`, thư mục gốc. Nhánh `main` giữ toàn bộ mã nguồn. Bộ dựng dùng các PDF ở thư mục `../Slide 2024` nếu có, nếu không dùng bản PDF đã đi kèm trong `dist/sources/`.

## Kiểm tra đã thực hiện

Kiểm tra số lượng và cấu trúc 218 câu, lựa chọn không trùng, mã câu duy nhất, tham chiếu trang nằm trong PDF, dấu vân tay các PDF. Kiểm tra thao tác thực tế trên trình duyệt: luyện tập, bài kiểm tra 10/10, câu bỏ trống, ôn câu sai, khôi phục bài khi tải lại, và bố cục điện thoại.
