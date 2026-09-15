# Ôn tập kỹ thuật y sinh · BF2601 & ET4551

[Mở trang ôn tập](https://nguyentienloc14072000-prog.github.io/on-tap-hoa-sinh-bf2601/)

Trang ôn tập tiếng Việt dành cho cá nhân và bạn bè, gồm hai môn trên cùng một website. Chọn môn ở đầu trang; ngân hàng câu hỏi và tiến độ của mỗi môn được lưu riêng.

| Môn | Tài liệu | Trang PDF | Câu hỏi |
| --- | --- | ---: | ---: |
| Hóa sinh y sinh · BF2601 | 9 PDF của bộ Slide 2024 | 497 | 218 |
| An toàn trong kỹ thuật y sinh · ET4551 | 19 PDF bài giảng | 791 | 307 |

Môn An toàn gồm 5 bài an toàn sinh học, 12 bài bức xạ và 2 tài liệu trong thư mục an toàn điện (bao gồm bài tổng hợp quản lý rủi ro). Không lấy kiến thức trên Internet, bài thuyết trình sinh viên, tiểu luận hoặc đề thi. Đạo đức chỉ được nhắc ở mức giới thiệu trong bài An toàn sinh học 1. Các số liệu/văn bản được giữ trong bối cảnh bài giảng; những nội dung mâu thuẫn hoặc không rõ không dùng để đặt câu hỏi.

**525 câu trắc nghiệm** chia theo từng file, có giải thích và đường dẫn đến trang PDF nguồn. Ghi chú là bản tóm tắt để ôn tập; PDF gốc là tài liệu đối chiếu.

[Mở trực tiếp môn An toàn](https://nguyentienloc14072000-prog.github.io/on-tap-hoa-sinh-bf2601/#course/et4551)

## Sử dụng

- Đọc ghi chú và mở PDF theo từng phần.
- Luyện tập với phản hồi sau mỗi câu, hoặc tự kiểm tra để xem đáp án khi nộp bài.
- Trộn thứ tự câu hỏi và đáp án; chọn 10, 20, 30 câu hoặc toàn bộ phạm vi.
- Xem kết quả, ôn lại câu sai và tiếp tục lượt làm bài đã lưu.
- Chuyển môn mà không mất lượt ôn của môn kia. Dữ liệu Hóa sinh từ bản một môn được giữ lại khi nâng cấp.

Không cần tài khoản. Tiến độ được lưu trong trình duyệt trên từng thiết bị; không đồng bộ giữa bạn bè hoặc thiết bị. Trang không gửi kết quả lên máy chủ.

## Cấu trúc

- `dist/`: website có thể xuất bản trực tiếp, bao gồm PDF nguồn trong `dist/sources/`.
- `content/s01.json` … `s09.json`: ghi chú và ngân hàng câu hỏi theo từng PDF.
- `content/at-*.json`: nội dung môn An toàn, tiền tố `b` = sinh học, `r` = bức xạ, `e` = điện/quản lý rủi ro.
- `content/courses.json`: danh mục môn và đường dẫn tương đối tới tài liệu nguồn.
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
node --test tests/state.test.cjs
git add content dist noi-dung-theo-file scripts tests README.md
git commit -m "Cap nhat noi dung on tap"
git push origin main
git subtree push --prefix dist origin gh-pages
```

GitHub Pages xuất bản nhánh `gh-pages`, thư mục gốc. Nhánh `main` giữ toàn bộ mã nguồn. Bộ dựng dùng PDF gốc theo `content/courses.json` nếu có, nếu không dùng PDF đã đi kèm trong `dist/sources/`. Không cần tải tài liệu từ Internet để dựng lại.

## Kiểm tra đã thực hiện

Kiểm tra cấu trúc 525 câu, lựa chọn không trùng, mã câu duy nhất, tham chiếu trang và dấu vân tay PDF. Kiểm thử tự động việc chuyển tiến độ Hóa sinh cũ, lưu riêng hai môn, từ chối trạng thái hỏng và số liệu danh mục. Kiểm tra trên trình duyệt: chọn môn/nhóm, luyện tập, chấm điểm, câu bỏ trống, ôn câu sai, khôi phục bài sau chuyển môn/tải lại và bố cục điện thoại. Nội dung học thuật của 218 câu Hóa sinh được giữ nguyên.
