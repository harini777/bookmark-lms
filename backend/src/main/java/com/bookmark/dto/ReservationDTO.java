package com.bookmark.dto;

import com.bookmark.entity.Reservation;
import com.bookmark.entity.ReservationStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class ReservationDTO {
    private Long id;
    private Long memberId;
    private String memberName;
    private String memberUsername;
    private Long bookId;
    private String bookTitle;
    private String bookIsbn;
    private ReservationStatus status;
    private Integer queuePosition;
    private LocalDateTime reservationDate;
    private LocalDateTime fulfilledAt;

    public static ReservationDTO fromEntity(Reservation r) {
        ReservationDTO dto = new ReservationDTO();
        dto.setId(r.getId());
        dto.setMemberId(r.getMember().getId());
        dto.setMemberName(r.getMember().getFullName());
        dto.setMemberUsername(r.getMember().getUsername());
        dto.setBookId(r.getBook().getId());
        dto.setBookTitle(r.getBook().getTitle());
        dto.setBookIsbn(r.getBook().getIsbn());
        dto.setStatus(r.getStatus());
        dto.setQueuePosition(r.getQueuePosition());
        dto.setReservationDate(r.getReservationDate());
        dto.setFulfilledAt(r.getFulfilledAt());
        return dto;
    }
}
