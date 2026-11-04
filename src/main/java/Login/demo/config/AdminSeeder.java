package Login.demo.config;

import Login.demo.entity.DoctorProfile;
import Login.demo.entity.Role;
import Login.demo.entity.User;
import Login.demo.repository.DoctorProfileRepository;
import Login.demo.repository.MedicineRepository;
import Login.demo.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds fixed role accounts on startup so they are always guaranteed to work.
 *
 * Credentials:
 *   admin       : hari kishore / hari632  (or admin / admin123)
 *   doctor      : doctor / doctor123
 *   lab         : central_lab / lab123
 *   pharmacy    : pharmacy / pharma123
 *   patient     : patient / patient123
 */
@Component
public class AdminSeeder implements ApplicationRunner {

    private static final String ADMIN_USERNAME = "hari kishore";
    private static final String ADMIN_PASSWORD = "hari632";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MedicineRepository medicineRepository;
    private final DoctorProfileRepository doctorProfileRepository;

    public AdminSeeder(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       MedicineRepository medicineRepository,
                       DoctorProfileRepository doctorProfileRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.medicineRepository = medicineRepository;
        this.doctorProfileRepository = doctorProfileRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        // 1. Permanent primary admin credentials
        User admin = userRepository.findByUsername(ADMIN_USERNAME).orElse(new User());
        admin.setUsername(ADMIN_USERNAME);
        admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
        admin.setRole(Role.ADMIN);
        userRepository.save(admin);
        System.out.println("[AdminSeeder] Primary Admin verified: username='" + ADMIN_USERNAME + "'");

        // 2. Permanent secondary admin credentials
        User admin2 = userRepository.findByUsername("admin").orElse(new User());
        admin2.setUsername("admin");
        admin2.setPassword(passwordEncoder.encode("admin123"));
        admin2.setRole(Role.ADMIN);
        userRepository.save(admin2);
        System.out.println("[AdminSeeder] Secondary Admin verified: username='admin' / password='admin123'");

        // 3. Permanent demo Lab Center account (central_lab / lab123)
        User lab = userRepository.findByUsername("central_lab").orElse(new User());
        lab.setUsername("central_lab");
        lab.setPassword(passwordEncoder.encode("lab123"));
        lab.setRole(Role.LAB);
        userRepository.save(lab);
        System.out.println("[AdminSeeder] Demo Lab account verified: username='central_lab' / password='lab123'");

        // 4. Permanent demo Pharmacy account (pharmacy / pharma123)
        User pharma = userRepository.findByUsername("pharmacy").orElse(new User());
        pharma.setUsername("pharmacy");
        pharma.setPassword(passwordEncoder.encode("pharma123"));
        pharma.setRole(Role.PHARMACY);
        userRepository.save(pharma);
        System.out.println("[AdminSeeder] Demo Pharmacy account verified: username='pharmacy' / password='pharma123'");

        // 5. Remove dummy seeded doctor ("doctor" / "Dr. Alexander Smith") so only real doctors appear
        userRepository.findByUsername("doctor").ifPresent(d -> {
            doctorProfileRepository.findByUser(d).ifPresent(doctorProfileRepository::delete);
            userRepository.delete(d);
            System.out.println("[AdminSeeder] Removed dummy doctor account ('doctor').");
        });

        // 6. Permanent demo Patient account (patient / patient123)
        User patient = userRepository.findByUsername("patient").orElse(new User());
        patient.setUsername("patient");
        patient.setPassword(passwordEncoder.encode("patient123"));
        patient.setRole(Role.PATIENT);
        userRepository.save(patient);
        System.out.println("[AdminSeeder] Demo Patient account verified: username='patient' / password='patient123'");

        // 7. Seed authentic pharmacy medicines if inventory is empty
        if (medicineRepository.count() == 0) {
            medicineRepository.save(new Login.demo.entity.Medicine("Paracetamol 650mg", 50, 10, 45.00));
            medicineRepository.save(new Login.demo.entity.Medicine("Amoxicillin 500mg", 50, 10, 120.00));
            medicineRepository.save(new Login.demo.entity.Medicine("Cetirizine 10mg", 50, 10, 35.00));
            medicineRepository.save(new Login.demo.entity.Medicine("Ibuprofen 400mg", 50, 10, 60.00));
            medicineRepository.save(new Login.demo.entity.Medicine("Pantoprazole 40mg", 50, 10, 95.00));
            medicineRepository.save(new Login.demo.entity.Medicine("Azithromycin 500mg", 50, 6, 110.00));
            System.out.println("[AdminSeeder] Authentic pharmacy medicine inventory seeded successfully.");
        }
    }
}
