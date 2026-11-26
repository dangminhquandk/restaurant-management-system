# KỊCH BẢN THUYẾT TRÌNH BÁO CÁO ĐỀ TÀI (SPEAKER SCRIPT CHI TIẾT)

**Học phần:** Nhập môn Công nghệ Phần mềm (IT3180) — ĐHBK Hà Nội
**Đề tài:** Hệ thống Quản lý Nhà hàng Thực tế (Restaurant Management System)
**Giảng viên hướng dẫn:** TS. Nguyễn Nhất Hải
**Thời lượng chuẩn:** 10 – 12 phút (khoảng 1 phút / slide)

---

## BẢNG PHÂN CHIA NGƯỜI THUYẾT TRÌNH (3 BẠN LÊN BỤC)

* **Đào Trần Hoàng Hải (Frontend / UI):** Phụ trách **Slide 1 $\rightarrow$ Slide 5** (Giới thiệu, Nỗi đau thực tế, Mục tiêu, Tác nhân & Phân hệ chức năng).
* **Vũ Tuấn Anh (DevOps / Backend):** Phụ trách **Slide 6 $\rightarrow$ Slide 7** (Yêu cầu phi chức năng, WebSocket, Kiến trúc 3 tầng & Tech Stack).
* **Bùi Đại Nghĩa (QA / Tài liệu):** Phụ trách **Slide 8 $\rightarrow$ Slide 10** (Lộ trình 4 Sprint Agile, Phân công nhiệm vụ, Cam kết sản phẩm & Q&A).

*(Lưu ý: Nếu bạn Quân có mặt thì Quân mở đầu Slide 1 - 3 và chốt Slide 9 - 10, kịch bản vẫn giữ nguyên).*

---

### SLIDE 1: TRANG TIÊU ĐỀ

* **Người trình bày:** Đào Trần Hoàng Hải 
* **Thời lượng:** 45 giây
* **Nội dung trên slide:** Tên đề tài, IT3180, GVHD: TS. Nguyễn Nhất Hải, 4 thành viên nhóm 1.
* **Lời thoại nói trước lớp:**
  > *"Em xin kính chào thầy Nguyễn Nhất Hải và các bạn. Hôm nay, nhóm 1 xin đại diện báo cáo về đề tài bài tập lớn môn Nhập môn Công nghệ phần mềm: **'Xây dựng Hệ thống Quản lý Nhà hàng Thực tế' (Restaurant Management System)**.*
  > *Nhóm gồm có 4 thành viên: bạn Đặng Minh Quân là nhóm trưởng, em là Đào Trần Hoàng Hải, cùng hai bạn Vũ Tuấn Anh và Bùi Đại Nghĩa.*
  > *Hôm nay, nhóm em xin phép được trình bày về bối cảnh bài toán, các yêu cầu hệ thống và kế hoạch triển khai của nhóm trong học kỳ này."*
  >

---

### SLIDE 2: THỰC TRẠNG & KHÓ KHĂN TẠI NHÀ HÀNG VỪA VÀ NHỎ

* **Người trình bày:** Đào Trần Hoàng Hải
* **Thời lượng:** 1 phút
* **Nội dung trên slide:** 3 nút thắt: Order giấy thủ công, Lệch pha Bếp & Sảnh, Thanh toán chậm & Khó đối soát.
* **Lời thoại nói trước lớp:**
  > *"Thưa thầy và các bạn, xuất phát từ thực tế khi quan sát các nhà hàng ăn uống tầm trung và vừa hiện nay, quy trình vận hành thủ công đang bộc lộ 3 điểm nghẽn rất lớn, đặc biệt là vào các khung giờ cao điểm:*
  >
  > * **Thứ nhất là quy trình gọi món bằng giấy:** Phục vụ phải ghi chép tay vội vàng rồi chạy bộ vào bếp đưa phiếu, mất từ 3 đến 5 phút. Chữ viết vội rất dễ đọc nhầm hoặc sót các ghi chú quan trọng của khách như 'ít cay' hay 'không hành'.*
  > * **Thứ hai là sự lệch pha thông tin giữa Bếp và Sảnh:** Nhiều trường hợp bếp đã hết sạch nguyên liệu nhưng phục vụ ở ngoài không biết, vẫn nhận đơn của khách rồi sau đó phải vào xin lỗi đổi món; hoặc ngược lại, món nấu xong để nguội trên quầy vì bếp không có cách nào báo tức thời ra ngoài.*
  > * **Thứ ba là khâu thanh toán chậm và khó đối soát:** Khách phải đứng xếp hàng chờ tính tiền, nhân viên dễ tính nhầm tiền mặt hoặc mất thời gian kiểm tra tài khoản ngân hàng xem khách đã chuyển khoản thật hay chưa.*
  >   *Từ 3 vấn đề nhức nhối trên, nhóm nhận thấy nhu cầu cấp thiết về một giải pháp số hóa quy trình khép kín."*
  >

---

### SLIDE 3: MỤC TIÊU ĐỀ TÀI & HƯỚNG TIẾP CẬN GIẢI PHÁP

* **Người trình bày:** Đào Trần Hoàng Hải
* **Thời lượng:** 1 phút
* **Nội dung trên slide:** Mục tiêu tổng quát; 3 tiêu chí: Real-time, Trực quan, Thanh toán tự động; Sơ đồ luồng Bàn $\rightarrow$ Bếp $\rightarrow$ Thu ngân.
* **Lời thoại nói trước lớp:**
  > *"Để giải quyết triệt để bài toán đó, mục tiêu của nhóm em là: **Xây dựng một hệ thống Web điều phối và đồng bộ đơn hàng khép kín từ Bàn ăn đến Nhà bếp** với 3 tiêu chí cốt lõi:*
  >
  > * **Đầu tiên là tính thời gian thực (Zero-delay):** Khi nhân viên bấm gửi đơn tại bàn, thông tin phải hiển thị ngay lập tức trên màn hình bếp trong vòng dưới 1 giây qua kết nối mạng nội bộ.*
  > * **Thứ hai là trực quan và dễ sử dụng:** Giao diện sơ đồ bàn giúp nhân viên nhận biết ngay bàn nào đang trống, bàn nào có khách, và thao tác gọi món chỉ mất dưới 3 lần chạm.*
  > * **Thứ ba là tự động hóa thanh toán:** Hệ thống tự động tạo mã VietQR động chứa chính xác số tiền của hóa đơn đó, khách chỉ cần quét mã là thanh toán xong, nhân viên không cần nhập tay số tiền.*
  >   *Quan trọng hơn, hệ thống giúp loại bỏ hoàn toàn máy in bill giấy truyền thống vốn hay kẹt giấy và tốn chi phí nguyên liệu."*
  >

---

### SLIDE 4: CÁC TÁC NHÂN CHÍNH TRONG HỆ THỐNG (ACTORS)

* **Người trình bày:** Đào Trần Hoàng Hải
* **Thời lượng:** 1 phút
* **Nội dung trên slide:** 4 tác nhân: Phục vụ/Thu ngân, Bếp/Bar, Quản lý/Chủ quán, Khách hàng.
* **Lời thoại nói trước lớp:**
  > *"Hệ thống được thiết kế hướng tới 4 nhóm tác nhân chính tham gia vào quy trình vận hành:*
  >
  > * **1. Nhân viên phục vụ và thu ngân:** Sử dụng máy tính bảng hoặc màn hình POS để quản lý sơ đồ bàn, mở bàn, chọn món theo thực đơn và in hóa đơn tạm tính.*
  > * **2. Nhân viên Bếp và Bar:** Không cần dùng giấy, chỉ cần nhìn màn hình KDS (Kitchen Display System), theo dõi các món cần làm theo thứ tự gọi trước làm trước và bấm chuyển trạng thái khi đã chế biến xong.*
  > * **3. Chủ nhà hàng hoặc Quản lý:** Sử dụng cổng quản trị (Admin) trên máy tính để thêm/sửa món ăn, đổi giá, bật tắt trạng thái hết món và theo dõi doanh thu trong ngày.*
  > * **4. Khách hàng:** Được trải nghiệm dịch vụ nhanh chóng và quét mã VietQR để thanh toán chính xác từng nghìn đồng mà không sợ nhầm lẫn."*
  >

---

### SLIDE 5: CÁC PHÂN HỆ CHỨC NĂNG CỐT LÕI

* **Người trình bày:** Đào Trần Hoàng Hải
* **Thời lượng:** 1 phút 15 giây
* **Nội dung trên slide:** 4 phân hệ: Sơ đồ bàn & POS, Màn hình bếp KDS, Thanh toán VietQR, Quản trị Admin.
* **Lời thoại nói trước lớp:**
  > *"Về mặt chức năng, hệ thống được chia thành 4 phân hệ nghiệp vụ độc lập nhưng kết nối chặt chẽ với nhau:*
  >
  > * **Phân hệ 1 - Sơ đồ bàn & POS:** Hiển thị toàn bộ bàn ăn theo màu sắc trực quan (ví dụ: Xanh lá là bàn trống, Đỏ là đang có khách). Hỗ trợ tìm kiếm món ăn cực nhanh theo danh mục và thêm ghi chú riêng cho từng món.*
  > * **Phân hệ 2 - Màn hình Bếp (KDS):** Đây là trái tim của việc điều phối bếp. Đơn gọi món từ sảnh chuyển thẳng vào đây, có chuông âm thanh cảnh báo khi có món mới, giúp đầu bếp không bị sót đơn.*
  > * **Phân hệ 3 - Thanh toán VietQR:** Hệ thống kết nối với chuẩn VietQR để sinh mã thanh toán động đúng với tổng tiền đơn hàng, ghi nhận thanh toán thành công và hỗ trợ tách gộp bàn.*
  > * **Phân hệ 4 - Quản trị Admin:** Giúp quản lý toàn quyền cấu hình menu món, phân quyền tài khoản cho nhân viên thu ngân và nhân viên bếp, xem biểu đồ doanh thu trực quan.*
  >   *Sau đây, em xin mời bạn Vũ Tuấn Anh tiếp tục trình bày về các yêu cầu kỹ thuật và kiến trúc của hệ thống."*
  >

---

### SLIDE 6: YÊU CẦU PHI CHỨC NĂNG & THÁCH THỨC KỸ THUẬT

* **Người trình bày:** Vũ Tuấn Anh
* **Thời lượng:** 1 phút
* **Nội dung trên slide:** 01. Truyền thông thời gian thực (WebSocket STOMP), loại bỏ polling; 02. Kiểm soát tranh chấp dữ liệu (Concurrency Control), tối ưu thao tác cảm ứng.
* **Lời thoại nói trước lớp:**
  > *"Kính thưa thầy, về mặt kỹ thuật, một hệ thống nhà hàng hoạt động trong giờ cao điểm đòi hỏi các yêu cầu phi chức năng rất khắt khe:*
  >
  > * **Thách thức lớn nhất là vấn đề thời gian thực (Real-time):** Nếu dùng kỹ thuật gọi API lặp định kỳ (HTTP Polling) thông thường thì vừa gây trễ dữ liệu, vừa làm nghẽn server. Vì vậy, nhóm quyết định xây dựng kênh giao tiếp hai chiều bằng **WebSocket chuẩn giao thức STOMP**. Khi thu ngân gửi đơn, server sẽ push dữ liệu tức thì xuống màn hình bếp với độ trễ dưới 1 giây.*
  > * **Thách thức thứ hai là kiểm soát tranh chấp dữ liệu (Concurrency Control):** Tránh hiện tượng hai nhân viên cùng lúc mở một bàn trống và gọi hai đơn khác nhau vào cùng một bàn. Nhóm áp dụng cơ chế khóa dữ liệu (Locking mechanism) ở cấp CSDL và Backend để đảm bảo dữ liệu luôn nhất quán.*
  > * **Thứ ba là tối ưu thao tác:** Giao diện được thiết kế các nút bấm kích thước lớn, tương phản cao, tối ưu cho màn hình cảm ứng tablet để nhân viên thao tác nhanh nhất có thể."*
  >

---

### SLIDE 7: KIẾN TRÚC PHẦN MỀM & CÔNG NGHỆ ĐỀ XUẤT

* **Người trình bày:** Vũ Tuấn Anh
* **Thời lượng:** 1 phút 15 giây
* **Nội dung trên slide:** Mô hình 3 tầng (Presentation, Application, Data) + Môi trường Docker.
* **Lời thoại nói trước lớp:**
  > *"Để hiện thực hóa các yêu cầu trên, nhóm lựa chọn mô hình kiến trúc phân tầng chuẩn mực trong công nghiệp phần mềm:*
  >
  > * **Tầng Giao diện (Presentation Layer):** Nhóm sử dụng **ReactJS kết hợp TypeScript và Vite**. Lý do chọn là vì tốc độ render cực nhanh, type-safe giúp giảm thiểu lỗi runtime, và kết hợp **TailwindCSS** giúp tùy biến giao diện linh hoạt trên cả trình duyệt máy tính lẫn tablet.*
  > * **Tầng Xử lý nghiệp vụ (Application Layer):** Nhóm lựa chọn **Java 17 và Spring Boot 3.x**. Spring Boot mang lại cấu trúc chặt chẽ, bảo mật mạnh mẽ qua Spring Security và tích hợp sẵn thư viện Spring WebSocket / STOMP để xử lý kết nối thời gian thực.*
  > * **Tầng Cơ sở dữ liệu (Data Layer):** Nhóm sử dụng **PostgreSQL**. Đây là hệ quản trị CSDL quan hệ mạnh mẽ, được thiết kế chuẩn hóa mức 3NF, đảm bảo đầy đủ các tính chất ACID để không bao giờ xảy ra sai lệch trong thanh toán hóa đơn.*
  > * **Về Môi trường triển khai:** Toàn bộ hệ thống từ Database, Backend đến Frontend đều được đóng gói bằng **Docker và Docker Compose**, cho phép bất kỳ thành viên nào hay thầy cô kiểm tra đều có thể khởi chạy ứng dụng chỉ với một câu lệnh duy nhất.*
  >   *Tiếp theo, em xin mời bạn Bùi Đại Nghĩa trình bày về kế hoạch triển khai và phân công công việc của nhóm."*
  >

---

### SLIDE 8: KẾ HOẠCH TRIỂN KHAI (AGILE / SCRUM)

* **Người trình bày:** Bùi Đại Nghĩa
* **Thời lượng:** 1 phút
* **Nội dung trên slide:** 4 Sprint kéo dài 8 tuần (Sprint 1: Thiết kế $\rightarrow$ Sprint 2: Core $\rightarrow$ Sprint 3: Realtime/Thanh toán $\rightarrow$ Sprint 4: Test/Đóng gói).
* **Lời thoại nói trước lớp:**
  > *"Kính thưa thầy, nhóm em áp dụng quy trình phát triển phần mềm theo phương pháp Agile/Scrum như được giảng dạy trong học phần IT3180. Dự án được chia làm 4 Sprint trong 8 tuần:*
  >
  > * **Sprint 1 (Tuần 1 - 2) - Khảo sát & Thiết kế:** Hoàn thành tài liệu đặc tả yêu cầu SRS phiên bản 1.0, thiết kế cơ sở dữ liệu (sơ đồ ERD) và vẽ giao diện mẫu trên Figma.*
  > * **Sprint 2 (Tuần 3 - 4) - Xây dựng Khung nền tảng (Core Engine):** Khởi tạo database PostgreSQL, lập trình chức năng đăng nhập/phân quyền, API quản lý bàn và trang Admin quản lý món ăn.*
  > * **Sprint 3 (Tuần 5 - 6) - Bếp Real-time & Thanh toán:** Tích hợp WebSocket kết nối giữa POS và KDS, tích hợp sinh mã thanh toán VietQR động và viết API thống kê doanh thu.*
  > * **Sprint 4 (Tuần 7 - 8) - Kiểm thử & Đóng gói:** Viết kịch bản kiểm thử (Test cases), kiểm thử chức năng và hiệu năng, đóng gói hệ thống bằng Docker và hoàn thiện báo cáo đồ án.*
  >   *Ở cuối mỗi Sprint, nhóm đều có sản phẩm chạy được (working software) để kiểm tra và nghiệm thu."*
  >

---

### SLIDE 9: PHÂN CÔNG NHIỆM VỤ THÀNH VIÊN

* **Người trình bày:** Bùi Đại Nghĩa
* **Thời lượng:** 1 phút
* **Nội dung trên slide:** Bảng phân công 4 bạn: Quân, Hải, Tuấn Anh, Nghĩa.
* **Lời thoại nói trước lớp:**
  > *"Để đảm bảo dự án hoàn thành đúng tiến độ, công việc được phân chia cụ thể cho từng thành viên dựa trên năng lực và thế mạnh:*
  >
  > * **Bạn Đặng Minh Quân (Nhóm trưởng):** Chịu trách nhiệm thiết kế CSDL (vẽ ERD, viết script tạo bảng), viết Backend quản lý bàn, tạo đơn gọi món, kết nối WebSocket cho bếp và theo dõi tiến độ chung.*
  > * **Bạn Đào Trần Hoàng Hải:** Phụ trách thiết kế toàn bộ UI trên Figma, lập trình Frontend ứng dụng POS cho thu ngân và màn hình KDS cho nhà bếp, kết nối các API.*
  > * **Bạn Vũ Tuấn Anh:** Lập trình phân hệ Quản trị Admin (quản lý món ăn, danh mục, tài khoản), viết các API quản trị và cấu hình môi trường Docker cho cả dự án.*
  > * **Em (Bùi Đại Nghĩa):** Phụ trách tích hợp thanh toán VietQR và logic thống kê doanh thu, thiết kế kịch bản kiểm thử (Test cases), thực hiện test lỗi và soạn thảo báo cáo đồ án môn học.*
  >   *Cách phân chia này giúp mỗi bạn phụ trách trọn vẹn một mảng từ giao diện đến nghiệp vụ, đảm bảo khối lượng công việc đồng đều."*
  >

---

### SLIDE 10: KẾT QUẢ KỲ VỌNG & LỜI CẢM ƠN (Q&A)

* **Người trình bày:** Bùi Đại Nghĩa
* **Thời lượng:** 45 giây
* **Nội dung trên slide:** 3 sản phẩm bàn giao (Web app, Bộ hồ sơ SRS/Test, Mã nguồn GitHub Docker) + Thông điệp cảm ơn & Q&A.
* **Lời thoại nói trước lớp:**
  > *"Về kết quả kỳ vọng, vào cuối kỳ nhóm em cam kết bàn giao:*
  >
  > * *Thứ nhất: Một ứng dụng Web hoàn chỉnh chạy thực tế trên máy tính bảng và desktop, đầy đủ 3 phân hệ POS, KDS và Admin.*
  > * *Thứ hai: Bộ hồ sơ tài liệu CNPM chuẩn mực, bao gồm tài liệu đặc tả SRS, sơ đồ thiết kế CSDL và bảng kịch bản kiểm thử chi tiết.*
  > * *Thứ ba: Toàn bộ mã nguồn được lưu trữ trên GitHub và đóng gói Docker chạy được ngay lập tức chỉ với một câu lệnh.*
  >
  > *Bài trình bày về đề tài của nhóm 1 đến đây là kết thúc. Chúng em xin chân thành cảm ơn thầy Nguyễn Nhất Hải và các bạn đã chú ý lắng nghe. Nhóm rất mong nhận được những nhận xét và góp ý của thầy để hoàn thiện đề tài tốt hơn trong các sprint tiếp theo. Chúng em xin sẵn sàng trả lời các câu hỏi ạ!"*
  >

---

## BỘ CÂU HỎI THẦY HẢI RẤT DỄ HỎI VÀ CÁCH TRẢ LỜI NGẮN GỌN (CHOP GỌN)

* **Câu 1: "Tại sao nhóm chọn WebSocket mà không dùng cơ chế khác đơn giản hơn?"**

  * 👉 **Trả lời (Tuấn Anh/Quân):** *"Dạ thưa thầy, trong môi trường nhà hàng giờ cao điểm, tần suất gửi món và cập nhật trạng thái bếp rất dày đặc. Nếu dùng HTTP Polling, máy khách phải gửi request liên tục mỗi 2 giây, tạo ra tải thừa và tiêu tốn băng thông không cần thiết. WebSocket thiết lập một kênh kết nối TCP liên tục hai chiều, server chỉ push dữ liệu khi có sự kiện phát sinh (Event-driven), vừa tiết kiệm tài nguyên vừa đảm bảo độ trễ dưới 1 giây ạ."*
* **Câu 2: "Trường hợp mất kết nối mạng (mất Wifi) thì bếp và thu ngân xử lý thế nào?"**

  * 👉 **Trả lời (Hải/Tuấn Anh):** *"Dạ thưa thầy, hệ thống được thiết kế chạy trên mạng cục bộ (Local Network) của nhà hàng nên không phụ thuộc vào Internet ra ngoài. Ở phía Frontend, ReactJS có cơ chế lắng nghe trạng thái kết nối (Heartbeat). Nếu mất kết nối tạm thời, màn hình sẽ hiển thị cảnh báo đỏ và tự động reconnect ngay khi có mạng trở lại mà không làm mất dữ liệu đơn đang nhập dở ạ."*
* **Câu 3: "Hai nhân viên cùng chọn một bàn cùng lúc thì xử lý thế nào?"**

  * 👉 **Trả lời (Quân/Nghĩa):** *"Dạ thưa thầy, đây là bài toán Concurrency. Khi nhân viên A mở bàn, backend sẽ nhận request và kiểm tra trạng thái bàn. Nhóm áp dụng kỹ thuật Optimistic Locking (Khóa lạc quan) với trường version trong database, nếu nhân viên B gửi yêu cầu mở cùng bàn đó sau, hệ thống sẽ trả về mã lỗi thông báo bàn vừa được sử dụng và cập nhật lại giao diện của nhân viên B ngay lập tức ạ."*
