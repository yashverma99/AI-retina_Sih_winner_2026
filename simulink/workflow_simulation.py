# workflow_simulation.py

print("=" * 60)
print("        RETINAAI - RURAL SCREENING SIMULATION")
print("=" * 60)

def simulate_centre(name, patients_per_day, doctor_capacity):
    quality_pass_rate = 0.90
    ai_processing_rate = 0.95
    referral_rate = 0.20

    quality_passed = patients_per_day * quality_pass_rate
    ai_screened = quality_passed * ai_processing_rate
    referral_queue = ai_screened * referral_rate

    reviewed = min(referral_queue, doctor_capacity)
    waiting = max(referral_queue - reviewed, 0)

    print(f"\n{name}")
    print("-" * 60)
    print(f"Patients / Day       : {patients_per_day}")
    print(f"Quality Passed       : {quality_passed:.0f}")
    print(f"AI Screened          : {ai_screened:.0f}")
    print(f"Referral Queue       : {referral_queue:.0f}")
    print(f"Doctor Capacity      : {doctor_capacity:.0f}")
    print(f"Doctor Reviewed      : {reviewed:.0f}")
    print(f"Waiting for Review   : {waiting:.0f}")

    if waiting > 0:
        print("Bottleneck            : Doctor Capacity")
    else:
        print("Bottleneck            : None")


# -------------------------------------------------
# INPUT
# -------------------------------------------------

try:
    centres = int(input("\nEnter number of PHCs: "))

    if centres <= 0:
        raise ValueError

except ValueError:
    print("Invalid number of PHCs.")
    exit()


# -------------------------------------------------
# SIMULATION
# -------------------------------------------------

for i in range(1, centres + 1):

    print(f"\nPHC {i}")

    try:
        patients = int(input("Patients per day: "))
        doctors = int(input("Doctor review capacity: "))

        if patients <= 0 or doctors <= 0:
            raise ValueError

    except ValueError:
        print("Invalid input. Skipping this PHC.")
        continue

    simulate_centre(
        f"PHC {i}",
        patients,
        doctors
    )


# -------------------------------------------------
# FINAL
# -------------------------------------------------

print("\n" + "=" * 60)
print("             SIMULATION COMPLETED")
print("=" * 60)

print(
    "This prototype models screening throughput, "
    "referral queues and doctor-review capacity."
)

print(
    "All parameters are configurable assumptions "
    "for workflow simulation."
)

print("=" * 60)