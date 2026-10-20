package com.bookmark.repository;

import com.bookmark.entity.Book;
import com.bookmark.entity.Reservation;
import com.bookmark.entity.ReservationStatus;
import com.bookmark.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {

    List<Reservation> findByMemberOrderByReservationDateDesc(User member);

    List<Reservation> findByMemberAndStatus(User member, ReservationStatus status);

    List<Reservation> findByBookAndStatusOrderByReservationDateAsc(Book book, ReservationStatus status);

    List<Reservation> findByStatusOrderByReservationDateAsc(ReservationStatus status);

    boolean existsByMemberAndBookAndStatus(User member, Book book, ReservationStatus status);

    @Query("SELECT COUNT(r) FROM Reservation r WHERE r.book = :book AND r.status = 'ACTIVE'")
    long countActiveForBook(@Param("book") Book book);
}
