package Login.demo.service;
import Login.demo.entity.Appointment;
import Login.demo.entity.AppointmentStatus;
import java.util.List;
import Login.demo.dto.AvailabilityRequest;
import Login.demo.entity.*;
import Login.demo.repository.AppointmentRepository;
import Login.demo.repository.AvailabilitySlotRepository;
import Login.demo.repository.UserRepository;
import org.springframework.stereotype.Service;
import java.util.List;
@Service
public class DoctorService {

    private final AvailabilitySlotRepository availabilitySlotRepository;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    public DoctorService(
            AvailabilitySlotRepository availabilitySlotRepository,
            UserRepository userRepository,
            AppointmentRepository appointmentRepository) {

        this.availabilitySlotRepository = availabilitySlotRepository;
        this.userRepository = userRepository;
        this.appointmentRepository = appointmentRepository;
    }

    public AvailabilitySlot createAvailability(
            String username,
            AvailabilityRequest request) {

        User doctor = userRepository.findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Doctor not found"));

        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException(
                    "Only doctors can create availability");
        }

        AvailabilitySlot slot = new AvailabilitySlot();

        slot.setDoctor(doctor);
        slot.setDate(request.getDate());
        slot.setStartTime(request.getStartTime());
        slot.setEndTime(request.getEndTime());
        slot.setAvailable(true);

        return availabilitySlotRepository.save(slot);
    }
    public List<AvailabilitySlot> getAvailableSlots(Integer doctorId) {

        return availabilitySlotRepository
                .findByDoctorIdAndAvailableTrueOrderByDateAscStartTimeAsc(
                        doctorId
                );
    }
    public List<Appointment> getPendingAppointments(
            String username) {

        User doctor = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Doctor not found"));

        if (doctor.getRole() != Role.DOCTOR) {
            throw new RuntimeException(
                    "Only doctors can view appointment requests");
        }

        return appointmentRepository.findByDoctorAndStatus(
                doctor,
                AppointmentStatus.PENDING
        );
    }
}