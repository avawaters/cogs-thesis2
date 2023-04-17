library(tidyverse)
library(jsonlite)
library(ez)
library(ggplot2)

data <- data.frame(id = character(),
                   music_hist = numeric(),
                   music_curr = numeric(),
                   seed = numeric(),
                   version = character(),
                   range = numeric(),
                   rating = numeric(),
                   plays = numeric(),
                   stringsAsFactors = FALSE)

participants <- data.frame(id=character(),
                          music_hist_any=numeric(),
                          music_hist=numeric(),
                          music_curr=numeric())

dir <- "../data/"

sub_list <- list.files(dir, pattern="json")

##### LOOP THROUGH ALL SUBJECTS #####
for (sub in sub_list) {
  
  # import JSON data
  sub_df <- fromJSON(paste0(dir, sub)) %>% 
            select(-c("rt", "trial_type", "time_elapsed", "trial_index",
                      "internal_node_id", "question_order"))
  
  # save subject ID
  sub <- unlist(strsplit(sub, ".json"))[1]
  
  # info abt music experience
  music_hist_any <- as.integer(ifelse(unlist(sub_df[5,]$response)["Q0"] == "No", 0, 1))
  music_hist <- as.integer(ifelse(unlist(sub_df[5,]$response)["Q0"] == "No", 0, unlist(sub_df[6,]$response)["LessonYears"]))
  music_curr <- as.integer(ifelse(((unlist(sub_df[5,]$response)["Q0"] == "No") || 
                                  (sub_df[6,]$response)["LessonCurrent"] == "No"), 0, 1))
  
  # df with responses
  responses <- sub_df %>% filter(task == "rate") %>%
               mutate(response=unlist(response) + 1) %>%
               rename(rating=response) %>%
               select(c("rating", "version", "melody", "range", "n_plays")) %>%
               mutate(sub=sub, music_hist=music_hist, music_curr=music_curr)
  
  data <- data %>% rbind(responses)
  
  participants <- participants %>% rbind(data.frame(sub=sub, music_hist_any=music_hist_any,
                                                    music_hist=music_hist, music_curr=music_curr))
}

data$sub <- as.factor(data$sub)
data$melody <- as.factor(data$melody)
data$version <- as.factor(data$version)

data

##### ANALYSIS OF DATA #####
## summary statistics abt the participants
# proportion of ppl with any music experience
any_music <- participants %>% summarize(n=sum(music_hist_any), prop=sum(music_hist_any) / 60)
# avg number of years of music lessons
avg_yrs <- participants %>% filter(music_hist_any==1) %>% 
          summarize(avg=mean(music_hist))
curr_music <- participants %>% filter(music_hist_any==1) %>%
              summarize(n=sum(music_curr), prop=sum(music_curr) / 23)

## ANOVA call args:
#   wid = var to collapse across
#   within = vars that vary btwn obs of the same wid var
#   between = vars that vary btwn obs of diff wid vars

# ANOVA for version and rating
unadj_anova <- ezANOVA(data, dv=rating, wid=sub, within=c(melody, version))$ANOVA

# ANOVA for version and rating, accounting for:
#   - musical experience
#   - range
anova <- ezANOVA(data, dv=rating, wid=sub, within=c(melody, version), between=music_hist, observed=music_hist)$ANOVA

## FIGURE
data %>% group_by(melody, version) %>% mutate(avg_rating=mean(rating), se=sd(rating)/sqrt(n())) %>% ungroup() %>%
         ggplot(aes(x=version, y=avg_rating, ymin=avg_rating-se, ymax=avg_rating+se, color=melody, group=melody)) + 
         theme_light() +
         geom_point(size=2.5) + geom_line() + geom_errorbar(width=0.03) +
         labs(title="Average Ratings for Predictable vs. Unpredictable Melodies by Seed",
              x="Version", y="Average Rating (1 to 7)", color="Seed Melody") +
         theme(plot.title = element_text(hjust = 0.5)) +
         scale_x_discrete(labels=c("Predictable", "Unpredictable")) + 
         scale_color_manual(values=c("seagreen3", "royalblue1", "indianred1", "purple1"))

## summary stats about the melodies
data %>% group_by(melody, version) %>% 
         summarize(listens=mean(n_plays), sd_listens=sd(n_plays),
                   rating=mean(rating))

data %>% group_by(melody, version) %>% summarize(sd=sd(rating))

# look at how many times participants play each melody
table(data$melody, data$version, data$n_plays)

## ANOVA EXCLUDING MELODY 4
data_no4 <- data %>% filter(melody!=4) 
data_no4$sub <- as.factor(data_no4$sub)
data_no4$melody <- as.factor(data_no4$melody)
data_no4$version <- as.factor(data_no4$version)
data_no4$music_hist <- as.factor(data_no4$music_hist)
anova_no4 <- ezANOVA(data_no4, dv=rating, wid=sub, within=c(melody, version), between=music_hist, observed=music_hist)$ANOVA

# paired t-test for melody 4 
pred_seed4 <- unlist(as.vector(data %>% filter(melody==4 & version=="p") %>% select(rating)))
unpred_seed4 <- unlist(as.vector(data %>% filter(melody==4 & version=="u") %>% select(rating)))

t.test(pred_seed4, y=unpred_seed4, paired=TRUE)

# melodic cloze graph for seed 1
# gen 4-6 for unpred, had to go thru all the audio, doesn't reflect the numbers the algorithm spit out
# gen 6 for pred, had to go thru all the audio, doesn't reflect the numbers the algorithm spit out
seed1_df <- data.frame(c("Predictable", "Unpredictable"),
                       c(11/40, 11/40), 
                       c(10/40, 10/40),
                       c(13/40, 3/40),
                       c(9/22, 5/18),
                       c(8/20, 9/20),
                       c(5/18, 4/21))


colnames(seed1_df) <- c("version", "gen1", "gen2", "gen3", "gen4", "gen5", "gen6")

seed1_df %>% pivot_longer(cols=starts_with("gen"), names_to="gen", 
                          names_prefix="gen", values_to="probability") %>% 
             ggplot(aes(x=gen, y=probability*100, linetype=version, group=version)) + 
             geom_point(color="seagreen3") + geom_line(color="seagreen3") +
             labs(title="Melodic Cloze Probability for Melody 1", 
                  x="Generation", y="Probability", linetype="Version") +
             theme_light() + theme(plot.title = element_text(hjust = 0.5))
