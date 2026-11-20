package com.embobinados.apugen_backend.dto;

import lombok.Data;

@Data
public class ProcessRequestDTO {
    private String serviceRequest;
    private String companyId;
    private String mainProcess;
    private String power;
    private String serial;
    private String brand;
    private String location;
}
