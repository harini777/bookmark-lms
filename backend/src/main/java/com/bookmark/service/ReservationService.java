package com.bookmark.service;

import com.bookmark.dto.ReservationDTO;
import com.bookmark.entity.*;
import com.bookmark.exception.BadRequestException;
import com.bookmark.exception.ResourceNotFoundException;
import com.bookmark.repository.BookRepository;
import com.bookmark.repository.ReservationRepository;
import com.bookmark.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final BookRepository bookRepository;
    private final UserRepository userRepository;

    @Transactional
    public ReservationDTO reserveBook(Long bookId, String username) {
        User member = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (member.getRole() != Role.MEMBER) {
            throw new BadRequestException("Only members can reserve books");
        }

        if (member.getStatus() != MemberStatus.APPROVED && member.getStatus() != MemberStatus.ACTIVE) {
            throw new BadRequestException("Member account is not approved (status: " + member.getStatus() + ")");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Book not found: " + bookId));

        if (book.getAvailableCopies() > 0) {
            throw new BadRequestException("Book currently has available copies; you can borrow it directly without reservation");
        }

        if (reservationRepository.existsByMemberAndBookAndStatus(member, book, ReservationStatus.ACTIVE)) {
            throw new BadRequestException("You already have an active reservation for this book");
        }

        long activeCount = reservationRepository.countActiveForBook(book);

        Reservation reservation = new Reservation();
        reservation.setMember(member);
        reservation.setBook(book);
        reservation.setStatus(ReservationStatus.ACTIVE);
        reservation.setQueuePosition((int) activeCount + 1);

        return ReservationDTO.fromEntity(reservationRepository.save(reservation));
    }

    @Transactional
    public ReservationDTO cancelReservation(Long reservationId, String username) {
        Reservation reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ResourceNotFoundException("Reservation not found: " + reservationId));

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));

        if (user.getRole() == Role.MEMBER && !reservation.getMember().getId().equals(user.getId())) {
            throw new BadRequestException("You can only cancel your own reservation");
        }

        if (reservation.getStatus() != ReservationStatus.ACTIVE) {
            throw new BadRequestException("Reservation is not currently active");
        }

        reservation.setStatus(ReservationStatus.CANCELLED);
        reservation.setCancelledAt(LocalDateTime.now());
        reservationRepository.save(reservation);

        // Recompute queue positions for remaining active reservations
        List<Reservation> remaining = reservationRepository.findByBookAndStatusOrderByReservationDateAsc(
                reservation.getBook(), ReservationStatus.ACTIVE);
        int pos = 1;
        for (Reservation r : remaining) {
            r.setQueuePosition(pos++);
            reservationRepository.save(r);
        }

        return ReservationDTO.fromEntity(reservation);
    }

    public List<ReservationDTO> getMemberReservations(Long memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        return reservationRepository.findByMemberOrderByReservationDateDesc(member).stream()
                .map(ReservationDTO::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ReservationDTO> getAllActiveReservations() {
        return reservationRepository.findByStatusOrderByReservationDateAsc(ReservationStatus.ACTIVE).stream()
                .map(ReservationDTO::fromEntity)
                .collect(Collectors.toList());
    }
}
