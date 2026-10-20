package com.bookmark.controller;

import com.bookmark.dto.ReservationDTO;
import com.bookmark.service.ReservationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reservations")
@RequiredArgsConstructor
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping("/book/{bookId}")
    public ResponseEntity<ReservationDTO> reserveBook(@PathVariable Long bookId, Authentication authentication) {
        return ResponseEntity.ok(reservationService.reserveBook(bookId, authentication.getName()));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ReservationDTO> cancelReservation(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(reservationService.cancelReservation(id, authentication.getName()));
    }

    @GetMapping("/member/{memberId}")
    public ResponseEntity<List<ReservationDTO>> getMemberReservations(@PathVariable Long memberId) {
        return ResponseEntity.ok(reservationService.getMemberReservations(memberId));
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyRole('LIBRARIAN', 'ADMINISTRATOR')")
    public ResponseEntity<List<ReservationDTO>> getAllActiveReservations() {
        return ResponseEntity.ok(reservationService.getAllActiveReservations());
    }
}
