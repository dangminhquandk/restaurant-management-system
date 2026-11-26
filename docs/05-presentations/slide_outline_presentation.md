# KỊCH BẢN THUYẾT TRÌNH BẢO VỆ ĐỀ TÀI (SLIDE OUTLINE)
**Học phần:** Nhập môn Công nghệ Phần mềm (IT3180) - ĐHBK Hà Nội  
**Đề tài:** Hệ thống Quản lý Nhà hàng Thực tế (Restaurant Management System)  
**Thời lượng dự kiến:** 10 - 12 phút (khoảng 1 - 1.2 phút / slide)  
**Nhóm sinh viên:** Đặng Minh Quân, Đào Trần Hoàng Hải, Vũ Tuấn Anh, Bùi Đại Nghĩa  

---

## TỔNG QUAN PHÂN CHIA THUYẾT TRÌNH (TALK TRACK)
* **Phần 1: Mở đầu & Bài toán (Slide 1 - 3):** Nhóm trưởng Đặng Minh Quân (dẫn dắt, nêu lý do chọn đề tài).
* **Phần 2: Yêu cầu chức năng & Nghiệp vụ (Slide 4 - 6):** Bùi Đại Nghĩa & Đào Trần Hoàng Hải (trình bày Actors, Use Case, giao diện và KDS).
* **Phần 3: Kiến trúc kỹ thuật & Công nghệ (Slide 7):** Vũ Tuấn Anh (trình bày Tech Stack, Docker và luồng dữ liệu).
* **Phần 4: Kế hoạch & Phân công (Slide 8 - 10):** Đặng Minh Quân (tổng kết tiến độ Sprint, phân công nhiệm vụ và Q&A).

---

## CHI TIẾT NỘI DUNG 10 SLIDE

### SLIDE 1: TRANG TIÊU ĐỀ (TITLE SLIDE)
* **Tiêu đề lớn:** HỆ THỐNG QUẢN LÝ NHÀ HÀNG THỰC TẾ (RESTAURANT MANAGEMENT SYSTEM)
* **Tiêu đề phụ:** Báo cáo Khởi tạo & Đặc tả Bài toán - Học phần Nhập môn Công nghệ Phần mềm (IT3180)
* **Thông tin nhóm:**
  * Giảng viên hướng dẫn: `TS. Nguyễn Nhất Hải`
  * Nhóm sinh viên thực hiện:
    1. Đặng Minh Quân – MSSV: `202416323` (Nhóm trưởng)
    2. Đào Trần Hoàng Hải – MSSV: `202416190`
    3. Vũ Tuấn Anh – MSSV: `202416635`
    4. Bùi Đại Nghĩa – MSSV: `202416302`
* **Gợi ý hình ảnh/Thiết kế:** Logo ĐHBK Hà Nội + mockup phối cảnh hệ thống (POS tablet + màn hình bếp).
* **Lời thoại người nói (Quân):**  
  > *"Kính chào thầy/cô và các bạn. Hôm nay nhóm em xin phép trình bày đề tài bài tập lớn môn Nhập môn Công nghệ phần mềm: 'Xây dựng Hệ thống Quản lý Nhà hàng Thực tế'. Nhóm gồm 4 thành viên do em là Đặng Minh Quân làm nhóm trưởng."*

---

### SLIDE 2: BỐI CẢNH THỰC TẾ & VẤN ĐỀ ĐẶT RA (PAIN POINTS)
* **Tiêu đề:** Thực trạng & Khó khăn tại các nhà hàng truyền thống
* **Nội dung chính (3 nỗi đau cốt lõi):**
  1. **Nghẽn luồng Order giấy & gọi miệng:** Giờ cao điểm, bồi bàn phải chạy qua lại giữa sảnh và bếp $\rightarrow$ chậm trễ, dễ quên ghi chú (ít cay, không hành).
  2. **Sai sót & Bất đồng bộ giữa Bếp và Thu ngân:** Bếp hết món nhưng phục vụ không biết vẫn nhận đơn; bếp làm xong nhưng không báo được sảnh $\rightarrow$ thức ăn nguội, khách phàn nàn.
  3. **Thanh toán thủ công & Khó kiểm soát doanh thu:** Nhập nhầm tiền, đối soát chuyển khoản mất thời gian; chủ quán không có số liệu tức thời về món bán chạy để chuẩn bị nguyên liệu.
* **Gợi ý hình ảnh/Icon:** 3 icon tượng trưng: ❌ Giấy ghi order gạch xóa, ❌ Bếp quá tải/cháy món, ❌ Thất thoát doanh thu.
* **Lời thoại người nói (Quân):**  
  > *"Xuất phát từ thực tế khi đi ăn tại các nhà hàng vừa và nhỏ, chúng em nhận thấy quy trình ghi giấy và hô miệng gặp rất nhiều bất cập trong giờ cao điểm: khách đợi lâu, bếp làm nhầm món, thu ngân tính sai tiền. Vì vậy, bài toán đặt ra là cần một giải pháp số hóa toàn diện nhưng phải thật nhẹ, nhanh và dễ dùng."*

---

### SLIDE 3: MỤC TIÊU ĐỀ TÀI & PHẠM VI GIẢI PHÁP
* **Tiêu đề:** Mục tiêu Xây dựng Hệ thống
* **Nội dung chính:**
  * **Mục tiêu tổng quát:** Xây dựng một ứng dụng web quản lý nhà hàng thông minh, kết nối tức thời (Real-time) giữa Thu ngân/Phục vụ, Nhà bếp và Quản lý.
  * **3 Mục tiêu cốt lõi cần đạt:**
    * ⚡ **Zero-delay Order:** Đơn gọi tại bàn chuyển xuống bếp trong vòng dưới 1 giây qua WebSocket.
    * 📱 **Trực quan hóa sơ đồ bàn:** Nhận diện ngay bàn nào trống, bàn nào đang ăn, bàn nào chuẩn bị rời đi.
    * 💳 **Tự động hóa thanh toán:** Tích hợp sinh mã VietQR động theo đúng số tiền hóa đơn để khách quét trả tiền ngay tại bàn.
* **Gợi ý hình ảnh:** Sơ đồ luồng 1 chiều thông suốt: `Khách/Bàn` $\longrightarrow$ `Thu ngân (POS)` $\xleftrightarrow{\text{WebSocket}}$ `Màn hình Bếp (KDS)` $\longrightarrow$ `Báo cáo Doanh thu`.
* **Lời thoại người nói (Quân):**  
  > *"Mục tiêu của nhóm không chỉ là làm một phần mềm CRUD đơn thuần, mà là giải quyết bài toán đồng bộ thời gian thực giữa sảnh và bếp với độ trễ dưới 1 giây, giúp tăng tốc độ phục vụ lên tối thiểu 40%."*

---

### SLIDE 4: CÁC TÁC NHÂN TRONG HỆ THỐNG (ACTORS & PERSONAS)
* **Tiêu đề:** Các Đối tượng Sử dụng Hệ thống
* **Nội dung (Bảng 4 tác nhân chính):**
  * 🧑‍💼 **Thu ngân / Phục vụ bàn:** Xem sơ đồ bàn, mở bàn, chọn món theo menu, ghi chú khẩu vị, in hóa đơn tạm tính.
  * 👨‍🍳 **Nhân viên Bếp / Bar:** Xem màn hình KDS, nhận thông báo món mới, bấm chuyển trạng thái: *Đang nấu* $\rightarrow$ *Đã xong*.
  * 🧑‍💻 **Chủ / Quản lý nhà hàng:** Quản lý thực đơn (giá, thêm món, tắt món tạm hết), quản lý tài khoản nhân viên, xem biểu đồ doanh thu theo ngày.
  * 🙋 **Khách hàng:** Quét mã VietQR chuyển khoản chính xác, nhận diện trạng thái hóa đơn đã thanh toán.
* **Gợi ý hình ảnh:** 4 avatar nhân vật tương ứng với 4 vai trò kèm thiết bị sử dụng (Tablet, Màn hình treo bếp, Laptop quản lý, Điện thoại khách).
* **Lời thoại người nói (Nghĩa / Hải):**  
  > *"Hệ thống được thiết kế phục vụ 4 nhóm tác nhân chính, trong đó tương tác thường xuyên nhất là giữa bạn Thu ngân cầm máy POS và Đầu bếp nhìn màn hình KDS trong bếp."*

---

### SLIDE 5: YÊU CẦU CHỨC NĂNG CỐT LÕI (CORE FEATURES & USE CASE)
* **Tiêu đề:** Phân hệ Chức năng Chính (Use Case Overview)
* **Nội dung (4 phân hệ nghiệp vụ):**
  1. **Phân hệ Sơ đồ Bàn & POS:** Chọn bàn theo tầng, tạo order, đổi bàn, ghép bàn, ghi chú món (không hành, ít đường).
  2. **Phân hệ Màn hình Bếp (Kitchen Display System - KDS):** Nhận order real-time (FIFO - đơn vào trước làm trước), chuông báo khi có món mới, bấm hoàn thành để báo sảnh bưng món.
  3. **Phân hệ Thanh toán VietQR:** Tách/gộp hóa đơn linh hoạt, tự động sinh mã VietQR chuẩn NAPAS đúng số tiền đơn hàng, ghi nhận thanh toán tiền mặt hoặc chuyển khoản.
  4. **Phân hệ Quản trị (Admin):** CRUD danh mục & món ăn, bật tắt trạng thái 'hết hàng', báo cáo doanh thu theo ngày/tháng/ca.
* **Gợi ý hình ảnh:** Sơ đồ Use Case Diagram tổng quát hoặc 4 khối chức năng màu sắc trực quan.
* **Lời thoại người nói (Nghĩa / Hải):**  
  > *"Trên slide là 4 phân hệ chính của hệ thống. Điểm đặc biệt của phân hệ Bếp là loại bỏ hoàn toàn máy in bill nhiệt truyền thống vốn hay kẹt giấy, thay bằng màn hình tương tác cảm ứng hiện đại."*

---

### SLIDE 6: YÊU CẦU PHI CHỨC NĂNG & ĐIỂM NHẤN KỸ THUẬT
* **Tiêu đề:** Yêu cầu Phi chức năng & Thách thức Kỹ thuật
* **Nội dung chính:**
  * ⏱️ **Thời gian đáp ứng & Độ trễ:** Đồng bộ đơn hàng qua WebSocket STOMP đảm bảo độ trễ $< 1$ giây giữa sảnh và bếp.
  * 🔒 **Toàn vẹn dữ liệu (Concurrency Control):** Tránh hiện tượng 2 phục vụ mở trùng 1 bàn cùng một thời điểm (xử lý khóa lạc quan/bi quan).
  * 📱 **Trải nghiệm người dùng (UX):** Giao diện POS thiết kế nút bấm lớn, trực quan, hỗ trợ màn hình cảm ứng tablet/máy bán hàng để thao tác nhanh chỉ trong 3 chạm.
  * 📦 **Khả năng mở rộng:** Dễ dàng bổ sung chi nhánh mới hoặc bàn mới mà không cần sửa đổi cấu trúc CSDL.
* **Gợi ý hình ảnh:** Biểu đồ latency so sánh giữa HTTP Polling truyền thống (chậm, tốn băng thông) vs WebSocket Event-driven (tức thời).
* **Lời thoại người nói (Hải / Tuấn Anh):**  
  > *"Về mặt kỹ thuật, thách thức lớn nhất là vấn đề đồng bộ. Nhóm quyết định không dùng cơ chế kéo dữ liệu liên tục (polling) mà áp dụng WebSocket Event-driven, vừa tiết kiệm tài nguyên server vừa đảm bảo bếp nhận đơn tức thì."*

---

### SLIDE 7: KIẾN TRÚC HỆ THỐNG & CÔNG NGHỆ SỬ DỤNG
* **Tiêu đề:** Kiến trúc Phần mềm & Công nghệ Đề xuất
* **Nội dung 3 tầng:**
  * **Frontend (Client):** ReactJS (TypeScript, Vite) + TailwindCSS $\rightarrow$ Giao diện nhẹ, mượt mà trên trình duyệt web và tablet.
  * **Backend (Server):** Java 17, Spring Boot 3.x (Spring Data JPA, Spring Security JWT, Spring WebSocket STOMP) $\rightarrow$ Ổn định, chuẩn doanh nghiệp.
  * **Cơ sở dữ liệu:** PostgreSQL (Thiết kế chuẩn hóa 3NF, đảm bảo toàn vẹn giao dịch ACID).
  * **Đóng gói & Triển khai:** Docker & Docker Compose $\rightarrow$ Dễ dàng chạy thử chỉ với 1 câu lệnh trên mọi máy tính.
* **Gợi ý hình ảnh:** Sơ đồ 3 tầng (Frontend $\leftrightarrow$ REST API / WebSocket $\leftrightarrow$ Backend $\leftrightarrow$ PostgreSQL).
* **Lời thoại người nói (Tuấn Anh):**  
  > *"Nhóm lựa chọn công nghệ phổ biến trong công nghiệp: Spring Boot làm backend đảm bảo tính chặt chẽ, kết hợp với ReactJS ở frontend. Toàn bộ môi trường cơ sở dữ liệu và máy chủ được đóng gói bằng Docker, giúp việc cài đặt và demo diễn ra nhanh chóng."*

---

### SLIDE 8: KẾ HOẠCH TRIỂN KHAI (AGILE / SCRUM SPRINT)
* **Tiêu đề:** Lộ trình Thực hiện theo Phương pháp Agile
* **Nội dung (Bảng tiến độ 4 Sprint - 8 tuần):**
  * **Sprint 1 (Tuần 1 - 2):** Khảo sát yêu cầu, viết tài liệu SRS v1.0, thiết kế ERD database & vẽ wireframe Figma.
  * **Sprint 2 (Tuần 3 - 4):** Xây dựng CSDL, đăng nhập JWT, làm khung POS sơ đồ bàn và trang Admin quản lý món.
  * **Sprint 3 (Tuần 5 - 6):** Lập trình WebSocket kết nối POS $\rightarrow$ KDS, tích hợp mã VietQR và API thống kê.
  * **Sprint 4 (Tuần 7 - 8):** Viết Test cases, kiểm thử chức năng, đóng gói Docker hoàn chỉnh và hoàn thiện báo cáo môn học.
* **Gợi ý hình ảnh:** Biểu đồ Gantt chart hoặc lộ trình dạng Timeline mốc thời gian rõ ràng.
* **Lời thoại người nói (Quân):**  
  > *"Nhóm tuân thủ mô hình Agile/Scrum được giảng dạy trong học phần. Dự án được chia làm 4 Sprint kéo dài trong 8 tuần với các mốc bàn giao sản phẩm chạy được ở cuối mỗi sprint."*

---

### SLIDE 9: PHÂN CÔNG CÔNG VIỆC TRONG NHÓM
* **Tiêu đề:** Phân công Nhiệm vụ Thành viên
* **Nội dung (Rõ người rõ việc):**
  * **Đặng Minh Quân (Nhóm trưởng):** Thiết kế CSDL, lập trình Backend quản lý bàn & đơn hàng, làm socket báo bếp, quản lý tiến độ.
  * **Đào Trần Hoàng Hải:** Thiết kế Figma, lập trình giao diện màn hình thu ngân POS và màn hình bếp KDS, nối API.
  * **Vũ Tuấn Anh:** Lập trình trang quản trị Admin (quản lý món/nhân viên), viết API quản trị, cấu hình Docker.
  * **Bùi Đại Nghĩa:** Làm chức năng thanh toán VietQR & thống kê, viết test cases kiểm thử hệ thống, viết tài liệu báo cáo.
* **Gợi ý hình ảnh:** Bảng phân công 4 cột có ảnh thẻ/avatar của 4 bạn sinh viên.
* **Lời thoại người nói (Quân):**  
  > *"Khối lượng công việc được chia đều cho 4 bạn dựa trên thế mạnh của từng người, đảm bảo bạn nào cũng nắm chắc một phân hệ từ giao diện tới xử lý logic."*

---

### SLIDE 10: KẾT QUẢ KỲ VỌNG & HỎI ĐÁP (CONCLUSION & Q&A)
* **Tiêu đề:** Kết quả Kỳ vọng & Lắng nghe Góp ý
* **Nội dung chính:**
  * **Sản phẩm bàn giao dự kiến:**
    * 01 Web App hoạt động hoàn chỉnh (POS, KDS, Admin Portal).
    * Bộ tài liệu chuẩn CNPM: SRS đặc tả yêu cầu, tài liệu thiết kế CSDL, kịch bản kiểm thử (Test cases).
    * Mã nguồn công khai trên GitHub kèm hướng dẫn chạy bằng Docker.
  * **Thông điệp kết luận:** Số hóa quy trình nhà hàng với chi phí vận hành thấp nhất và độ tin cậy cao nhất.
  * **Lời cảm ơn & Mời đặt câu hỏi:** *"Nhóm em xin chân thành cảm ơn thầy cô và các bạn đã lắng nghe. Chúng em rất mong nhận được những nhận xét, góp ý quý báu để hoàn thiện đề tài tốt hơn!"*
* **Gợi ý hình ảnh:** Chữ **"THANK YOU & Q&A"** nổi bật + link GitHub repo của nhóm.
* **Lời thoại người nói (Quân):**  
  > *"Đó là toàn bộ kế hoạch và bài toán mà nhóm em hướng tới. Chúng em rất mong nhận được những góp ý từ thầy cô để định hướng chính xác hơn cho các sprint tiếp theo. Nhóm xin sẵn sàng trả lời các câu hỏi ạ!"*

---

## MẸO BẢO VỆ ĐỀ TÀI ĐẠT ĐIỂM CAO TRƯỚC GIẢNG VIÊN CNPM BÁCH KHOA
1. **Không sa đà vào code ở buổi đầu:** Thầy cô chấm điểm buổi này ở khâu: **Hiểu bài toán có thực tế không**, **Phân tích yêu cầu có đầy đủ không**, **Phân chia công việc có đều không**.
2. **Nhấn mạnh vào điểm khác biệt:** Hãy nhấn mạnh từ khóa **"Màn hình bếp KDS thời gian thực"** và **"VietQR tự động"**, vì nếu chỉ làm quản lý nhà hàng thêm/sửa/xóa thông thường thì sẽ rất cũ và không được đánh giá cao.
3. **Phân chia người nói đều:** Cả 4 bạn nên lần lượt bước lên nói ít nhất 1-2 slide để thầy cô thấy tinh thần làm việc nhóm gắn kết.
