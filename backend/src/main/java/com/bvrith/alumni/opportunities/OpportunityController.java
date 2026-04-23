package com.bvrith.alumni.opportunities;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
public class OpportunityController {
  private final OpportunityService opportunityService;

  public OpportunityController(OpportunityService opportunityService) {
    this.opportunityService = opportunityService;
  }

  @GetMapping("/opportunities")
  public Map<String, List<OpportunityRecord>> getOpportunities() {
    return Map.of("opportunities", opportunityService.getOpportunities());
  }

  @PostMapping("/opportunities")
  public ResponseEntity<Map<String, List<OpportunityRecord>>> createOpportunity(
      @Valid @RequestBody OpportunityRequest request
  ) {
    return ResponseEntity.ok(Map.of("opportunities", opportunityService.create(request)));
  }
}
